import apiClient from './apiClient';

export interface Account {
  id: string;
  company_id: string;
  account_number: string;
  name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parent_account_id?: string;
  parent_account?: Account;
  currency_code: string;
  is_active: boolean;
  description?: string;
  current_balance: number;
  debit_balance: number;
  credit_balance: number;
  created_at: string;
  updated_at: string;
}

export interface CreateAccountDto {
  account_number?: string;
  name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parent_account_id?: string;
  currency_code: string;
  is_active?: boolean;
  description?: string;
}

export interface UpdateAccountDto {
  name?: string;
  parent_account_id?: string;
  is_active?: boolean;
  description?: string;
}

export interface AccountFilterDto {
  account_type?: string;
  is_active?: boolean;
  search?: string;
}

export interface TrialBalanceEntry {
  account_id: string;
  account_number: string;
  account_name: string;
  account_type: string;
  debit_balance: number;
  credit_balance: number;
}

export interface GeneralLedgerEntry {
  journal_line_id: string;
  journal_entry_id: string;
  entry_date: string;
  description: string;
  reference: string;
  debit_amount: number;
  credit_amount: number;
  running_balance: number;
}

const accountService = {
  async create(data: CreateAccountDto): Promise<Account> {
    const response = await apiClient.post('/accounts', data);
    return response.data;
  },

  async findAll(filters?: AccountFilterDto): Promise<Account[]> {
    const response = await apiClient.get('/accounts', { params: filters });
    return response.data;
  },

  async findOne(id: string): Promise<Account> {
    const response = await apiClient.get(`/accounts/${id}`);
    return response.data;
  },

  async update(id: string, data: UpdateAccountDto): Promise<Account> {
    const response = await apiClient.put(`/accounts/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/accounts/${id}`);
  },

  async getChartOfAccounts(): Promise<Account[]> {
    const response = await apiClient.get('/accounts/chart');
    return response.data;
  },

  async getTrialBalance(startDate: string, endDate: string): Promise<TrialBalanceEntry[]> {
    const response = await apiClient.get('/accounts/trial-balance', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  async getGeneralLedger(
    accountId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<GeneralLedgerEntry[]> {
    const response = await apiClient.get('/accounts/general-ledger', {
      params: { accountId, startDate, endDate },
    });
    return response.data;
  },
};

export default accountService;
