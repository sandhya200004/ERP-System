import apiClient from './apiClient';

export interface Vendor {
  id: string;
  company_id: string;
  vendor_number: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  tax_id?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  default_currency_code?: string;
  payment_terms_days?: number;
  credit_limit?: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateVendorDto {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  tax_id?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  default_currency_code?: string;
  payment_terms_days?: number;
  credit_limit?: number;
  notes?: string;
  is_active?: boolean;
}

export interface UpdateVendorDto extends Partial<CreateVendorDto> {}

export interface VendorFilterDto {
  search?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export interface VendorStatistics {
  total: number;
  active: number;
  inactive: number;
}

const vendorService = {
  async create(data: CreateVendorDto): Promise<Vendor> {
    const response = await apiClient.post('/vendors', data);
    return response.data;
  },

  async findAll(filters?: VendorFilterDto): Promise<Vendor[]> {
    const response = await apiClient.get('/vendors', { params: filters });
    return response.data;
  },

  async findOne(id: string): Promise<Vendor> {
    const response = await apiClient.get(`/vendors/${id}`);
    return response.data;
  },

  async update(id: string, data: UpdateVendorDto): Promise<Vendor> {
    const response = await apiClient.put(`/vendors/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/vendors/${id}`);
  },

  async getStatistics(): Promise<VendorStatistics> {
    const response = await apiClient.get('/vendors/statistics');
    return response.data;
  },
};

export default vendorService;
