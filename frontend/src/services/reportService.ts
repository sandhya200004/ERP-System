import api from './api';

export interface ProfitAndLossData {
  revenue: number;
  cogs: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
  rows: string[][];
}

export interface BalanceSheetData {
  cash: number;
  accountsReceivable: number;
  inventory: number;
  totalAssets: number;
  accountsPayable: number;
  longTermDebt: number;
  equity: number;
  rows: string[][];
}

export interface CashFlowData {
  operatingActivities: number;
  investingActivities: number;
  financingActivities: number;
  netCashFlow: number;
  rows: string[][];
}

export interface ChartDataPoint {
  month: string;
  revenue: number;
  expenses: number;
}

export interface CategoryData {
  name: string;
  value: number;
}

export interface TaxSummaryData {
  totalTax: number;
  rows: string[][];
}

const reportService = {
  async getProfitAndLoss(startDate?: string, endDate?: string): Promise<ProfitAndLossData> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await api.get(`/reports/profit-loss?${params.toString()}`);
    return response.data;
  },

  async getBalanceSheet(): Promise<BalanceSheetData> {
    const response = await api.get('/reports/balance-sheet');
    return response.data;
  },

  async getCashFlow(startDate?: string, endDate?: string): Promise<CashFlowData> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await api.get(`/reports/cash-flow?${params.toString()}`);
    return response.data;
  },

  async getRevenueExpensesChart(): Promise<ChartDataPoint[]> {
    const response = await api.get('/reports/revenue-expenses-chart');
    return response.data;
  },

  async getRevenueByCategory(): Promise<CategoryData[]> {
    const response = await api.get('/reports/revenue-by-category');
    return response.data;
  },

  async getTaxSummary(startDate?: string, endDate?: string): Promise<TaxSummaryData> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await api.get(`/reports/tax-summary?${params.toString()}`);
    return response.data;
  },
};

export default reportService;
