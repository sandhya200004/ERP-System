import apiClient from './apiClient';

export interface JournalLine {
  id?: string;
  account_id: string;
  account?: any;
  debit_amount: number;
  credit_amount: number;
  currency_code?: string;
  description?: string;
}

export interface JournalEntry {
  id: string;
  company_id: string;
  entry_number: string;
  entry_date: string;
  status: 'draft' | 'posted' | 'voided';
  reference_type?: string;
  reference_id?: string;
  description?: string;
  total_debit: number;
  total_credit: number;
  posted_by?: string;
  posted_at?: string;
  lines: JournalLine[];
  created_at: string;
  updated_at: string;
}

export interface CreateJournalEntryDto {
  entry_date: string;
  reference_type?: string;
  reference_id?: string;
  description?: string;
  lines: JournalLine[];
}

export interface JournalFilterDto {
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface FinancialReportDto {
  startDate: string;
  endDate: string;
}

const journalService = {
  async create(data: CreateJournalEntryDto): Promise<JournalEntry> {
    const response = await apiClient.post('/journal', data);
    return response.data;
  },

  async findAll(filters?: JournalFilterDto): Promise<JournalEntry[]> {
    const response = await apiClient.get('/journal', { params: filters });
    return response.data;
  },

  async findOne(id: string): Promise<JournalEntry> {
    const response = await apiClient.get(`/journal/${id}`);
    return response.data;
  },

  async post(id: string): Promise<JournalEntry> {
    const response = await apiClient.post(`/journal/${id}/post`);
    return response.data;
  },

  async void(id: string): Promise<JournalEntry> {
    const response = await apiClient.post(`/journal/${id}/void`);
    return response.data;
  },

  async getIncomeStatement(startDate: string, endDate: string): Promise<any> {
    const response = await apiClient.get('/journal/reports/income-statement', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  async getBalanceSheet(endDate: string): Promise<any> {
    const response = await apiClient.get('/journal/reports/balance-sheet', {
      params: { startDate: '2020-01-01', endDate },
    });
    return response.data;
  },

  async getCashFlow(startDate: string, endDate: string): Promise<any> {
    const response = await apiClient.get('/journal/reports/cash-flow', {
      params: { startDate, endDate },
    });
    return response.data;
  },
};

export default journalService;
