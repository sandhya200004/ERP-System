import apiClient from './api';

export interface Customer {
  id: string;
  customerNumber: string;
  name: string;
  customerType: 'business' | 'individual';
  email?: string;
  phone?: string;
  billingAddress1?: string;
  billingCity?: string;
  billingState?: string;
  billingCountry?: string;
  createdAt: string;
}

export interface CreateCustomerData {
  name: string;
  customerType: 'business' | 'individual';
  email?: string;
  phone?: string;
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  shippingAddressLine1?: string;
  shippingAddressLine2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  taxNumber?: string;
  notes?: string;
}

export const customerService = {
  getAll: async (params?: { search?: string; type?: string; page?: number; limit?: number }) => {
    const response = await apiClient.get('/customers', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data;
  },

  create: async (data: CreateCustomerData) => {
    const response = await apiClient.post('/customers', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateCustomerData>) => {
    const response = await apiClient.patch(`/customers/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/customers/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await apiClient.get('/customers/stats');
    return response.data;
  },
};
