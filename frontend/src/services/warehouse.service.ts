import apiClient from './apiClient';

export interface Warehouse {
  id: string;
  company_id: string;
  code: string;
  name: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateWarehouseDto {
  code: string;
  name: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  is_active?: boolean;
}

export interface UpdateWarehouseDto extends Partial<Omit<CreateWarehouseDto, 'code'>> {}

export interface WarehouseFilterDto {
  is_active?: boolean;
}

export interface StockLevel {
  item_id: string;
  item: any;
  quantity_on_hand: number;
  reserved_quantity: number;
  available_quantity: number;
}

const warehouseService = {
  async create(data: CreateWarehouseDto): Promise<Warehouse> {
    const response = await apiClient.post('/warehouses', data);
    return response.data;
  },

  async findAll(filters?: WarehouseFilterDto): Promise<Warehouse[]> {
    const response = await apiClient.get('/warehouses', { params: filters });
    return response.data;
  },

  async findOne(id: string): Promise<Warehouse> {
    const response = await apiClient.get(`/warehouses/${id}`);
    return response.data;
  },

  async update(id: string, data: UpdateWarehouseDto): Promise<Warehouse> {
    const response = await apiClient.put(`/warehouses/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/warehouses/${id}`);
  },

  async getStockLevels(id: string): Promise<StockLevel[]> {
    const response = await apiClient.get(`/warehouses/${id}/stock`);
    return response.data;
  },
};

export default warehouseService;
