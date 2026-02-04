import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateJournalEntryDto, JournalFilterDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class JournalService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, userId: string, createDto: CreateJournalEntryDto) {
    // Validate balanced entry
    const totalDebit = createDto.lines.reduce((sum, line) => sum + line.debit_amount, 0);
    const totalCredit = createDto.lines.reduce((sum, line) => sum + line.credit_amount, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException('Journal entry must be balanced (debits must equal credits)');
    }

    const entryNumber = await this.generateEntryNumber(companyId);

    return this.prisma.journal_entries.create({
      data: {
        id: crypto.randomUUID(),
        company_id: companyId,
        entry_number: entryNumber,
        entry_date: new Date(createDto.entry_date),
        reference_type: createDto.reference_type,
        reference_id: createDto.reference_id,
        description: createDto.description,
        status: 'draft',
        created_by: userId,
        updated_at: new Date(),
        journal_lines: {
          create: createDto.lines.map((line, index) => ({
            id: crypto.randomUUID(),
            line_number: index + 1,
            account_id: line.account_id,
            debit_amount: line.debit_amount,
            credit_amount: line.credit_amount,
            currency_code: line.currency_code || 'USD',
            description: line.description,
            created_at: new Date(),
          })),
        },
      },
      include: {
        journal_lines: {
          include: {
            accounts: true,
          },
        },
      },
    });
  }

  async findAll(companyId: string, filter: JournalFilterDto) {
    const where: Prisma.journal_entriesWhereInput = {
      company_id: companyId,
    };

    if (filter.status) {
      where.status = filter.status as any;
    }

    if (filter.startDate || filter.endDate) {
      const dateFilter: any = {};
      if (filter.startDate) {
        dateFilter.gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        dateFilter.lte = new Date(filter.endDate);
      }
      where.entry_date = dateFilter;
    }

    return this.prisma.journal_entries.findMany({
      where,
      include: {
        journal_lines: {
          include: {
            accounts: true,
          },
        },
      },
      orderBy: { entry_date: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const entry = await this.prisma.journal_entries.findFirst({
      where: {
        id,
        company_id: companyId,
      },
      include: {
        journal_lines: {
          include: {
            accounts: true,
          },
        },
      },
    });

    if (!entry) {
      throw new NotFoundException('Journal entry not found');
    }

    return entry;
  }

  async post(companyId: string, id: string, userId: string) {
    const entry = await this.findOne(companyId, id);

    if (entry.status !== 'draft') {
      throw new BadRequestException('Only draft entries can be posted');
    }

    return this.prisma.journal_entries.update({
      where: { id },
      data: {
        status: 'posted',
        posted_at: new Date(),
        posted_by: userId,
        updated_at: new Date(),
      },
      include: {
        journal_lines: {
          include: {
            accounts: true,
          },
        },
      },
    });
  }

  async void(companyId: string, id: string) {
    const entry = await this.findOne(companyId, id);

    if (entry.status === 'voided') {
      throw new BadRequestException('Entry is already voided');
    }

    return this.prisma.journal_entries.update({
      where: { id },
      data: {
        status: 'voided',
        updated_at: new Date(),
      },
    });
  }

  async getIncomeStatement(companyId: string, startDate: Date, endDate: Date) {
    const journalLines = await this.prisma.journal_lines.findMany({
      where: {
        journal_entries: {
          company_id: companyId,
          status: 'posted',
          entry_date: {
            gte: startDate,
            lte: endDate,
          },
        },
        accounts: {
          account_type: {
            in: ['revenue', 'expense'],
          },
        },
      },
      include: {
        accounts: true,
      },
    });

    const revenue = new Map();
    const expenses = new Map();

    journalLines.forEach((line) => {
      const account = line.accounts;
      const amount = Number(line.credit_amount) - Number(line.debit_amount);

      if (account.account_type === 'revenue') {
        revenue.set(account.id, {
          account_number: account.account_number,
          account_name: account.name,
          amount: (revenue.get(account.id)?.amount || 0) + amount,
        });
      } else if (account.account_type === 'expense') {
        expenses.set(account.id, {
          account_number: account.account_number,
          account_name: account.name,
          amount: (expenses.get(account.id)?.amount || 0) - amount,
        });
      }
    });

    const revenueArray = Array.from(revenue.values());
    const expenseArray = Array.from(expenses.values());

    const totalRevenue = revenueArray.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenseArray.reduce((sum, item) => sum + item.amount, 0);
    const netIncome = totalRevenue - totalExpenses;

    return {
      period: { startDate, endDate },
      revenue: revenueArray,
      expenses: expenseArray,
      totals: {
        revenue: totalRevenue,
        expenses: totalExpenses,
        netIncome,
      },
    };
  }

  async getBalanceSheet(companyId: string, asOfDate: Date) {
    const journalLines = await this.prisma.journal_lines.findMany({
      where: {
        journal_entries: {
          company_id: companyId,
          status: 'posted',
          entry_date: {
            lte: asOfDate,
          },
        },
        accounts: {
          account_type: {
            in: ['asset', 'liability', 'equity'],
          },
        },
      },
      include: {
        accounts: true,
      },
    });

    const assets = new Map();
    const liabilities = new Map();
    const equity = new Map();

    journalLines.forEach((line) => {
      const account = line.accounts;
      const debit = Number(line.debit_amount);
      const credit = Number(line.credit_amount);
      const amount = debit - credit;

      const targetMap =
        account.account_type === 'asset' ? assets :
        account.account_type === 'liability' ? liabilities : equity;

      targetMap.set(account.id, {
        account_number: account.account_number,
        account_name: account.name,
        amount: (targetMap.get(account.id)?.amount || 0) + amount,
      });
    });

    const assetArray = Array.from(assets.values());
    const liabilityArray = Array.from(liabilities.values());
    const equityArray = Array.from(equity.values());

    const totalAssets = assetArray.reduce((sum, item) => sum + item.amount, 0);
    const totalLiabilities = liabilityArray.reduce((sum, item) => sum + item.amount, 0);
    const totalEquity = equityArray.reduce((sum, item) => sum + item.amount, 0);

    return {
      asOfDate,
      assets: assetArray,
      liabilities: liabilityArray,
      equity: equityArray,
      totals: {
        assets: totalAssets,
        liabilities: totalLiabilities,
        equity: totalEquity,
        check: totalAssets - (totalLiabilities + totalEquity), // Should be 0
      },
    };
  }

  async getCashFlow(companyId: string, startDate: Date, endDate: Date) {
    // Simplified cash flow - categorize by account type
    const journalLines = await this.prisma.journal_lines.findMany({
      where: {
        journal_entries: {
          company_id: companyId,
          status: 'posted',
          entry_date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      include: {
        accounts: true,
        journal_entries: true,
      },
    });

    // Identify cash accounts
    const cashAccounts = await this.prisma.accounts.findMany({
      where: {
        company_id: companyId,
        name: {
          contains: 'cash',
          mode: 'insensitive',
        },
      },
    });

    const cashAccountIds = new Set(cashAccounts.map(a => a.id));

    let operatingCashFlow = 0;
    let investingCashFlow = 0;
    let financingCashFlow = 0;

    journalLines.forEach((line) => {
      if (cashAccountIds.has(line.account_id)) {
        const amount = Number(line.debit_amount) - Number(line.credit_amount);
        
        // Simple categorization based on reference type
        const refType = line.journal_entries.reference_type;
        if (refType === 'invoice' || refType === 'payment') {
          operatingCashFlow += amount;
        } else if (refType === 'asset_purchase') {
          investingCashFlow += amount;
        } else if (refType === 'loan' || refType === 'equity') {
          financingCashFlow += amount;
        } else {
          operatingCashFlow += amount; // Default to operating
        }
      }
    });

    const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;

    return {
      period: { startDate, endDate },
      operating: operatingCashFlow,
      investing: investingCashFlow,
      financing: financingCashFlow,
      netCashFlow,
    };
  }

  private async generateEntryNumber(companyId: string): Promise<string> {
    const prefix = 'JE';
    const lastEntry = await this.prisma.journal_entries.findFirst({
      where: {
        company_id: companyId,
        entry_number: {
          startsWith: prefix,
        },
      },
      orderBy: {
        entry_number: 'desc',
      },
    });

    if (!lastEntry) {
      return `${prefix}-00001`;
    }

    const lastNumber = parseInt(lastEntry.entry_number.split('-')[1]);
    const nextNumber = lastNumber + 1;
    return `${prefix}-${nextNumber.toString().padStart(5, '0')}`;
  }
}
