import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get Profit & Loss report data
   */
  async getProfitAndLoss(company_id: string, startDate?: string, endDate?: string) {
    const dateFilter: any = { company_id };
    
    if (startDate && endDate) {
      dateFilter.invoice_date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Calculate revenue from paid invoices
    const revenueData = await this.prisma.invoices.aggregate({
      where: {
        ...dateFilter,
        status: { in: ['paid', 'partially_paid'] },
      },
      _sum: {
        amount_paid: true,
      },
    });

    const revenue = Number(revenueData._sum.amount_paid || 0);

    // For now, we'll estimate COGS and operating expenses
    // In a real system, these would come from expense tracking
    const cogs = revenue * 0.45; // 45% estimate
    const grossProfit = revenue - cogs;
    const operatingExpenses = revenue * 0.175; // 17.5% estimate
    const netProfit = grossProfit - operatingExpenses;

    return {
      revenue,
      cogs,
      grossProfit,
      operatingExpenses,
      netProfit,
      rows: [
        ['Revenue', '₹', revenue.toFixed(2)],
        ['Cost of Goods Sold', '₹', cogs.toFixed(2)],
        ['Gross Profit', '₹', grossProfit.toFixed(2)],
        ['Operating Expenses', '₹', operatingExpenses.toFixed(2)],
        ['Net Profit', '₹', netProfit.toFixed(2)],
      ],
    };
  }

  /**
   * Get Balance Sheet data
   */
  async getBalanceSheet(company_id: string) {
    // Cash = Total payments received - Total amounts paid out
    const paymentsReceived = await this.prisma.payments.aggregate({
      where: { company_id },
      _sum: { amount: true },
    });

    const cash = Number(paymentsReceived._sum.amount || 0);

    // Accounts Receivable = Outstanding invoice amounts
    const receivables = await this.prisma.invoices.aggregate({
      where: {
        company_id,
        status: { notIn: ['cancelled', 'paid'] },
      },
      _sum: { amount_due: true },
    });

    const accountsReceivable = Number(receivables._sum.amount_due || 0);

    // For inventory and other items, we'd need additional tracking
    const inventory = 0; // Placeholder
    const totalAssets = cash + accountsReceivable + inventory;

    // Liabilities - payments not yet made
    const accountsPayable = 0; // Placeholder - would need expense tracking
    const longTermDebt = 0; // Placeholder
    const equity = totalAssets - accountsPayable - longTermDebt;

    return {
      cash,
      accountsReceivable,
      inventory,
      totalAssets,
      accountsPayable,
      longTermDebt,
      equity,
      rows: [
        ['Assets', '', ''],
        ['Cash and Bank', '₹', cash.toFixed(2)],
        ['Accounts Receivable', '₹', accountsReceivable.toFixed(2)],
        ['Inventory', '₹', inventory.toFixed(2)],
        ['Total Assets', '₹', totalAssets.toFixed(2)],
        ['Liabilities', '', ''],
        ['Accounts Payable', '₹', accountsPayable.toFixed(2)],
        ['Long-term Debt', '₹', longTermDebt.toFixed(2)],
        ['Equity', '₹', equity.toFixed(2)],
      ],
    };
  }

  /**
   * Get Cash Flow data
   */
  async getCashFlow(company_id: string, startDate?: string, endDate?: string) {
    const dateFilter: any = { company_id };
    
    if (startDate && endDate) {
      dateFilter.payment_date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Operating activities = cash from customers
    const operating = await this.prisma.payments.aggregate({
      where: dateFilter,
      _sum: { amount: true },
    });

    const operatingActivities = Number(operating._sum.amount || 0);

    // Investing and financing would need additional tracking
    const investingActivities = 0;
    const financingActivities = 0;
    const netCashFlow = operatingActivities + investingActivities + financingActivities;

    return {
      operatingActivities,
      investingActivities,
      financingActivities,
      netCashFlow,
      rows: [
        ['Operating Activities', '₹', operatingActivities.toFixed(2)],
        ['Investing Activities', '₹', investingActivities.toFixed(2)],
        ['Financing Activities', '₹', financingActivities.toFixed(2)],
        ['Net Cash Flow', '₹', netCashFlow.toFixed(2)],
      ],
    };
  }

  /**
   * Get revenue vs expenses chart data (last 5 months)
   */
  async getRevenueExpensesChart(company_id: string) {
    const monthsData = [];
    const now = new Date();

    for (let i = 4; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthName = monthStart.toLocaleString('en-US', { month: 'short' });

      const revenueData = await this.prisma.invoices.aggregate({
        where: {
          company_id,
          invoice_date: {
            gte: monthStart,
            lte: monthEnd,
          },
          status: { in: ['paid', 'partially_paid'] },
        },
        _sum: { amount_paid: true },
      });

      const revenue = Number(revenueData._sum.amount_paid || 0);
      const expenses = revenue * 0.55; // Estimate expenses as 55% of revenue

      monthsData.push({
        month: monthName,
        revenue: Math.round(revenue),
        expenses: Math.round(expenses),
      });
    }

    return monthsData;
  }

  /**
   * Get revenue by category (from items in invoices)
   */
  async getRevenueByCategory(company_id: string) {
    // Get all invoice lines with item details
    const invoiceLines = await this.prisma.invoice_lines.findMany({
      where: {
        invoices: {
          company_id,
          status: { in: ['paid', 'partially_paid'] },
        },
      },
      include: {
        items: true,
      },
    });

    // Group by item type
    const categories: { [key: string]: number } = {
      Products: 0,
      Services: 0,
    };

    for (const line of invoiceLines) {
      const amount = Number(line.total);
      if (line.items && line.items.item_type === 'goods') {
        categories.Products += amount;
      } else if (line.items) {
        categories.Services += amount;
      }
    }

    return [
      { name: 'Products', value: Math.round(categories.Products) },
      { name: 'Services', value: Math.round(categories.Services) },
    ];
  }

  /**
   * Get tax summary
   */
  async getTaxSummary(company_id: string, startDate?: string, endDate?: string) {
    const dateFilter: any = { company_id };
    
    if (startDate && endDate) {
      dateFilter.invoice_date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Calculate total tax from invoices
    const taxData = await this.prisma.invoices.aggregate({
      where: dateFilter,
      _sum: { tax_total: true },
    });

    const totalTax = Number(taxData._sum.tax_total || 0);

    return {
      totalTax,
      rows: [
        ['Tax Type', 'Amount'],
        ['Total Tax Collected', `₹${totalTax.toFixed(2)}`],
      ],
    };
  }
}
