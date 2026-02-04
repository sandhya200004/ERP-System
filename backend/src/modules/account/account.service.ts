import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateAccountDto, UpdateAccountDto, AccountFilterDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, createDto: CreateAccountDto) {
    // Generate account number if not provided
    const accountNumber = createDto.account_number || await this.generateAccountNumber(
      companyId,
      createDto.account_type,
    );

    return this.prisma.accounts.create({
      data: {
        ...createDto,
        account_number: accountNumber,
        account_type: createDto.account_type as any,
        id: crypto.randomUUID(),
        company_id: companyId,
        updated_at: new Date(),
      },
      include: {
        currencies: true,
        accounts: true,
      },
    });
  }

  async findAll(companyId: string, filter: AccountFilterDto) {
    const where: Prisma.accountsWhereInput = {
      company_id: companyId,
      deleted_at: null,
    };

    if (filter.account_type) {
      where.account_type = filter.account_type as any;
    }

    if (filter.is_active !== undefined) {
      where.is_active = filter.is_active;
    }

    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { account_number: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.accounts.findMany({
      where,
      include: {
        currencies: true,
        accounts: true,
      },
      orderBy: { account_number: 'asc' },
    });
  }

  async getChartOfAccounts(companyId: string) {
    const accounts = await this.prisma.accounts.findMany({
      where: {
        company_id: companyId,
        deleted_at: null,
      },
      include: {
        currencies: true,
        accounts: true,
      },
      orderBy: { account_number: 'asc' },
    });

    // Build hierarchical structure
    const accountMap = new Map();
    const rootAccounts: any[] = [];

    accounts.forEach((account) => {
      accountMap.set(account.id, { ...account, children: [] });
    });

    accounts.forEach((account) => {
      if (account.parent_account_id) {
        const parent = accountMap.get(account.parent_account_id);
        if (parent) {
          parent.children.push(accountMap.get(account.id));
        }
      } else {
        rootAccounts.push(accountMap.get(account.id));
      }
    });

    return rootAccounts;
  }

  async getTrialBalance(companyId: string, startDate: Date, endDate: Date) {
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

    // Aggregate by account
    const balances = new Map();

    journalLines.forEach((line) => {
      const accountId = line.account_id;
      if (!balances.has(accountId)) {
        balances.set(accountId, {
          account: line.accounts,
          debit: 0,
          credit: 0,
        });
      }

      const balance = balances.get(accountId);
      balance.debit += Number(line.debit_amount);
      balance.credit += Number(line.credit_amount);
    });

    const trialBalance = Array.from(balances.values()).map((item) => ({
      account_number: item.account.account_number,
      account_name: item.account.name,
      account_type: item.account.account_type,
      debit: item.debit,
      credit: item.credit,
      balance: item.debit - item.credit,
    }));

    const totalDebit = trialBalance.reduce((sum, item) => sum + item.debit, 0);
    const totalCredit = trialBalance.reduce((sum, item) => sum + item.credit, 0);

    return {
      period: { startDate, endDate },
      accounts: trialBalance,
      totals: {
        debit: totalDebit,
        credit: totalCredit,
        difference: totalDebit - totalCredit,
      },
    };
  }

  async getGeneralLedger(
    companyId: string,
    accountId?: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const where: Prisma.journal_linesWhereInput = {
      journal_entries: {
        company_id: companyId,
        status: 'posted',
      },
    };

    if (accountId) {
      where.account_id = accountId;
    }

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) {
        dateFilter.gte = startDate;
      }
      if (endDate) {
        dateFilter.lte = endDate;
      }
      where.journal_entries = {
        entry_date: dateFilter,
      };
    }

    const entries = await this.prisma.journal_lines.findMany({
      where,
      include: {
        accounts: true,
        journal_entries: true,
      },
      orderBy: {
        journal_entries: {
          entry_date: 'asc',
        },
      },
    });

    let runningBalance = 0;
    const ledger = entries.map((line) => {
      const debit = Number(line.debit_amount);
      const credit = Number(line.credit_amount);
      runningBalance += debit - credit;

      return {
        date: line.journal_entries.entry_date,
        entry_number: line.journal_entries.entry_number,
        description: line.description || line.journal_entries.description,
        account: line.accounts.name,
        account_number: line.accounts.account_number,
        debit,
        credit,
        balance: runningBalance,
      };
    });

    return ledger;
  }

  async findOne(companyId: string, id: string) {
    const account = await this.prisma.accounts.findFirst({
      where: {
        id,
        company_id: companyId,
        deleted_at: null,
      },
      include: {
        currencies: true,
        accounts: true,
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  async update(companyId: string, id: string, updateDto: UpdateAccountDto) {
    await this.findOne(companyId, id);

    return this.prisma.accounts.update({
      where: { id },
      data: {
        ...updateDto,
        updated_at: new Date(),
      },
      include: {
        currencies: true,
        accounts: true,
      },
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);

    // Check if account has any journal entries
    const hasEntries = await this.prisma.journal_lines.count({
      where: { account_id: id },
    });

    if (hasEntries > 0) {
      throw new BadRequestException(
        'Cannot delete account with existing journal entries',
      );
    }

    return this.prisma.accounts.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  private async generateAccountNumber(
    companyId: string,
    accountType: string,
  ): Promise<string> {
    const prefix = this.getAccountPrefix(accountType);
    const lastAccount = await this.prisma.accounts.findFirst({
      where: {
        company_id: companyId,
        account_number: {
          startsWith: prefix,
        },
      },
      orderBy: {
        account_number: 'desc',
      },
    });

    if (!lastAccount) {
      return `${prefix}001`;
    }

    const lastNumber = parseInt(lastAccount.account_number.substring(prefix.length));
    const nextNumber = lastNumber + 1;
    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  }

  private getAccountPrefix(accountType: string): string {
    const prefixes: Record<string, string> = {
      asset: '1',
      liability: '2',
      equity: '3',
      revenue: '4',
      expense: '5',
    };
    return prefixes[accountType] || '9';
  }
}
