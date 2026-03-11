import apiClient from './apiClient';

export interface POLine {
  id?: string;
  item_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_amount?: number;
  line_total?: number;
}

export interface PurchaseOrder {
  id: string;
  company_id: string;
  po_number: string;
  vendor_id: string;
  vendor?: any;
  order_date: string;
  expected_date?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PARTIALLY_RECEIVED' | 'FULLY_RECEIVED' | 'CANCELLED';
  currency_code: string;
  subtotal: number;
  tax_total: number;
  total_amount: number;
  notes?: string;
  terms?: string;
  approved_by?: string;
  approved_at?: string;
  lines: POLine[];
  created_at: string;
  updated_at: string;
}

export interface CreatePurchaseOrderDto {
  vendor_id: string;
  order_date: string;
  expected_date?: string;
  currency_code?: string;
  notes?: string;
  terms?: string;
  lines: POLine[];
}

export interface UpdatePurchaseOrderDto {
  expected_date?: string;
  notes?: string;
  terms?: string;
}

export interface POFilterDto {
  status?: string;
  vendor_id?: string;
  search?: string;
  from_date?: string;
  to_date?: string;
}

export interface POStatistics {
  total: number;
  draft: number;
  submitted: number;
  approved: number;
  rejected: number;
  total_value: number;
}

const purchaseOrderService = {
  async create(data: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    const response = await apiClient.post('/purchase-orders', data);
    return response.data;
  },

  async findAll(filters?: POFilterDto): Promise<PurchaseOrder[]> {
    const response = await apiClient.get('/purchase-orders', { params: filters });
    return response.data;
  },

  async findOne(id: string): Promise<PurchaseOrder> {
    const response = await apiClient.get(`/purchase-orders/${id}`);
    return response.data;
  },

  async update(id: string, data: UpdatePurchaseOrderDto): Promise<PurchaseOrder> {
    const response = await apiClient.put(`/purchase-orders/${id}`, data);
    return response.data;
  },

  async submit(id: string): Promise<PurchaseOrder> {
    const response = await apiClient.post(`/purchase-orders/${id}/submit`);
    return response.data;
  },

  async approve(id: string): Promise<PurchaseOrder> {
    const response = await apiClient.post(`/purchase-orders/${id}/approve`);
    return response.data;
  },

  async reject(id: string): Promise<PurchaseOrder> {
    const response = await apiClient.post(`/purchase-orders/${id}/reject`);
    return response.data;
  },

  async cancel(id: string): Promise<PurchaseOrder> {
    const response = await apiClient.post(`/purchase-orders/${id}/cancel`);
    return response.data;
  },

  async getStatistics(): Promise<POStatistics> {
    const response = await apiClient.get('/purchase-orders/statistics');
    return response.data;
  },
};

export default purchaseOrderService;
