import apiClient from './apiClient';

export interface InvoiceLine {
  id?: string;
  po_line_id?: string;
  grn_line_id?: string;
  item_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_amount?: number;
  total?: number;
}

export interface SupplierInvoice {
  id: string;
  company_id: string;
  invoice_number: string;
  vendor_invoice_number: string;
  po_id?: string;
  grn_id?: string;
  vendor_id: string;
  vendor?: any;
  purchase_orders?: any;
  goods_receipts?: any;
  invoice_date: string;
  due_date: string;
  currency_code: string;
  subtotal: number;
  tax_total: number;
  total: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'partially_paid' | 'cancelled' | 'draft' | 'final';
  payment_status: 'pending' | 'unpaid' | 'partially_paid' | 'paid' | 'overdue' | 'completed' | 'failed' | 'cancelled';
  notes?: string;
  created_by: string;
  approved_by?: string;
  approved_at?: string;
  invoice_lines: InvoiceLine[];
  three_way_matches?: ThreeWayMatch;
  payments?: InvoicePayment[];
  created_at: string;
  updated_at: string;
}

export interface ThreeWayMatch {
  id: string;
  match_status: 'pending' | 'matched' | 'discrepancy' | 'approved' | 'rejected';
  po_total: number;
  grn_total: number;
  invoice_total: number;
  quantity_match: boolean;
  price_match: boolean;
  total_match: boolean;
  tolerance_pct: number;
  discrepancy_notes?: string;
  matched_by?: string;
  matched_at?: string;
}

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
}

export interface CreateSupplierInvoiceDto {
  vendor_invoice_number: string;
  po_id?: string;
  grn_id?: string;
  vendor_id: string;
  invoice_date: string;
  due_date: string;
  currency_code?: string;
  notes?: string;
  lines: InvoiceLine[];
}

export interface UpdateSupplierInvoiceDto {
  vendor_invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  notes?: string;
  lines?: InvoiceLine[];
}

export interface InvoiceFilterDto {
  vendor_id?: string;
  po_id?: string;
  grn_id?: string;
  status?: string;
  payment_status?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}

export interface RecordPaymentDto {
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number?: string;
  notes?: string;
}

export interface VendorStatistics {
  total_invoices: number;
  total_amount: number;
  paid_amount: number;
  pending_invoices: number;
}

const supplierInvoiceService = {
  async create(data: CreateSupplierInvoiceDto): Promise<SupplierInvoice> {
    const response = await apiClient.post('/supplier-invoices', data);
    return response.data;
  },

  async findAll(filters?: InvoiceFilterDto): Promise<SupplierInvoice[]> {
    const response = await apiClient.get('/supplier-invoices', { params: filters });
    return response.data;
  },

  async findOne(id: string): Promise<SupplierInvoice> {
    const response = await apiClient.get(`/supplier-invoices/${id}`);
    return response.data;
  },

  async update(id: string, data: UpdateSupplierInvoiceDto): Promise<SupplierInvoice> {
    const response = await apiClient.patch(`/supplier-invoices/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/supplier-invoices/${id}`);
  },

  async approve(id: string): Promise<SupplierInvoice> {
    const response = await apiClient.post(`/supplier-invoices/${id}/approve`, {});
    return response.data;
  },

  async reject(id: string, notes?: string): Promise<SupplierInvoice> {
    const response = await apiClient.post(`/supplier-invoices/${id}/reject`, { notes });
    return response.data;
  },

  async recordPayment(id: string, data: RecordPaymentDto): Promise<SupplierInvoice> {
    const response = await apiClient.post(`/supplier-invoices/${id}/payments`, data);
    return response.data;
  },

  async performMatch(id: string): Promise<ThreeWayMatch> {
    const response = await apiClient.post(`/supplier-invoices/${id}/match`, {});
    return response.data;
  },

  async cancel(id: string): Promise<SupplierInvoice> {
    const response = await apiClient.post(`/supplier-invoices/${id}/cancel`, {});
    return response.data;
  },

  async getVendorStatistics(vendorId: string): Promise<VendorStatistics> {
    const response = await apiClient.get(`/supplier-invoices/vendor/${vendorId}/statistics`);
    return response.data;
  },
};

export default supplierInvoiceService;
