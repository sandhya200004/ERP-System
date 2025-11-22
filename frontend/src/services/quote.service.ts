import api from './api';

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  quoteDate: string;
  validUntil: string;
  total: number;
  status: string;
  notes?: string;
}

export interface CreateQuoteData {
  customerId: string;
  quoteDate: string;
  validUntil: string;
  notes?: string;
  lines: Array<{
    itemId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

class QuoteService {
  async getAll(): Promise<Quote[]> {
    const response = await api.get('/quotes');
    return response.data;
  }

  async getById(id: string): Promise<Quote> {
    const response = await api.get(`/quotes/${id}`);
    return response.data;
  }

  async create(data: CreateQuoteData): Promise<Quote> {
    const response = await api.post('/quotes', data);
    return response.data;
  }

  async update(id: string, data: Partial<CreateQuoteData>): Promise<Quote> {
    const response = await api.patch(`/quotes/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/quotes/${id}`);
  }

  async getStats(): Promise<{ total: number; totalValue: number }> {
    const response = await api.get('/quotes/stats');
    return response.data;
  }
}

export const quoteService = new QuoteService();
