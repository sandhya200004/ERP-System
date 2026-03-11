import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface GRNLine {
  id?: string;
  item_id?: string;
  description: string;
  ordered_qty?: number;
  received_qty: number;
  warehouse_id?: string;
  location?: string;
  notes?: string;
}

export interface GoodsReceipt {
  id: string;
  grn_number: string;
  po_id?: string;
  vendor_id: string;
  receipt_date: string;
  status: 'draft' | 'completed' | 'cancelled';
  notes?: string;
  received_by: string;
  created_at: string;
  updated_at: string;
  grn_lines: GRNLine[];
  vendors?: any;
  purchase_orders?: any;
  users?: any;
}

export interface CreateGoodsReceiptDto {
  po_id?: string;
  vendor_id: string;
  receipt_date: string;
  notes?: string;
  lines: GRNLine[];
}

export interface UpdateGoodsReceiptDto {
  receipt_date?: string;
  notes?: string;
  lines?: GRNLine[];
}

export interface GRNStatistics {
  total: number;
  draft: number;
  completed: number;
  thisMonth: number;
}

class GoodsReceiptService {
  async create(data: CreateGoodsReceiptDto): Promise<GoodsReceipt> {
    const response = await api.post('/api/v1/goods-receipts', data);
    return response.data;
  }

  async findAll(filters?: {
    status?: string;
    vendor_id?: string;
    po_id?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<GoodsReceipt[]> {
    const response = await api.get('/api/v1/goods-receipts', { params: filters });
    return response.data;
  }

  async findOne(id: string): Promise<GoodsReceipt> {
    const response = await api.get(`/api/v1/goods-receipts/${id}`);
    return response.data;
  }

  async update(id: string, data: UpdateGoodsReceiptDto): Promise<GoodsReceipt> {
    const response = await api.put(`/api/v1/goods-receipts/${id}`, data);
    return response.data;
  }

  async confirm(id: string): Promise<GoodsReceipt> {
    const response = await api.post(`/api/v1/goods-receipts/${id}/confirm`);
    return response.data;
  }

  async cancel(id: string): Promise<GoodsReceipt> {
    const response = await api.post(`/api/v1/goods-receipts/${id}/cancel`);
    return response.data;
  }

  async getStatistics(): Promise<GRNStatistics> {
    const response = await api.get('/api/v1/goods-receipts/statistics');
    return response.data;
  }
}

export default new GoodsReceiptService();
