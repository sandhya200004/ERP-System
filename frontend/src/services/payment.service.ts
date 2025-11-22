import api from './api';

export interface Payment {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  reference: string;
  notes?: string;
}

export interface CreatePaymentData {
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  applications: Array<{
    invoiceId: string;
    amount: number;
  }>;
}

export interface PaymentResponse {
  data: Payment[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class PaymentService {
  async getAll(): Promise<PaymentResponse> {
    const response = await api.get('/payments');
    return response.data;
  }

  async getById(id: string): Promise<Payment> {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  }

  async create(data: CreatePaymentData): Promise<Payment> {
    const response = await api.post('/payments', data);
    return response.data;
  }

  async update(id: string, data: Partial<CreatePaymentData>): Promise<Payment> {
    const response = await api.patch(`/payments/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/payments/${id}`);
  }

  async getStats(): Promise<{ total: number; totalAmount: number }> {
    const response = await api.get('/payments/stats');
    return response.data;
  }
}

export const paymentService = new PaymentService();
