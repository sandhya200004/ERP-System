import apiClient from './api';

export interface InvoiceLine {
  itemId: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxIds?: string[];
}

export interface CreateInvoiceData {
  customerId: string;
  invoiceDate: string;
  dueDate: string;
  currencyCode?: string;
  discount?: number;
  terms?: string;
  notes?: string;
  lines: InvoiceLine[];
}

export const invoiceService = {
  getAll: async (params?: { search?: string; status?: string; customerId?: string; page?: number; limit?: number }) => {
    const response = await apiClient.get('/invoices', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/invoices/${id}`);
    return response.data;
  },

  create: async (data: CreateInvoiceData) => {
    const response = await apiClient.post('/invoices', data);
    return response.data;
  },

  createFromQuote: async (quoteId: string) => {
    const response = await apiClient.post(`/invoices/from-quote/${quoteId}`);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateInvoiceData>) => {
    const response = await apiClient.patch(`/invoices/${id}`, data);
    return response.data;
  },

  finalize: async (id: string) => {
    const response = await apiClient.post(`/invoices/${id}/finalize`);
    return response.data;
  },

  updateStatus: async (id: string, status: 'sent' | 'void') => {
    const response = await apiClient.patch(`/invoices/${id}/status/${status}`);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/invoices/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await apiClient.get('/invoices/stats');
    return response.data;
  },
};
