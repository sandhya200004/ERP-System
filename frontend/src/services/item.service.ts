import apiClient from './api';

export interface Item {
  id: string;
  itemNumber: string;
  name: string;
  itemType: 'goods' | 'service';
  unitPrice: number;
  unit?: string;
  sku?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateItemData {
  name: string;
  itemType: 'goods' | 'service';
  unitPrice: number;
  unit?: string;
  sku?: string;
  description?: string;
  isActive?: boolean;
  taxIds?: string[];
}

export const itemService = {
  getAll: async (params?: { search?: string; type?: string; isActive?: boolean; page?: number; limit?: number }) => {
    const response = await apiClient.get('/items', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/items/${id}`);
    return response.data;
  },

  create: async (data: CreateItemData) => {
    const response = await apiClient.post('/items', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateItemData>) => {
    const response = await apiClient.patch(`/items/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/items/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await apiClient.get('/items/stats');
    return response.data;
  },
};
