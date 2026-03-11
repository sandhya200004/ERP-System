import apiClient from './apiClient';

export interface StockLevel {
  id: string;
  company_id: string;
  warehouse_id: string;
  warehouse?: any;
  item_id: string;
  item?: any;
  quantity_on_hand: number;
  reserved_quantity: number;
  available_quantity: number;
  last_counted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  company_id: string;
  movement_type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
  warehouse_id: string;
  warehouse?: any;
  item_id: string;
  item?: any;
  quantity: number;
  unit_cost?: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  created_by: string;
  created_at: string;
}

export interface CreateStockMovementDto {
  movement_type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
  warehouse_id: string;
  item_id: string;
  quantity: number;
  unit_cost?: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
}

export interface StockTransferDto {
  from_warehouse_id: string;
  to_warehouse_id: string;
  item_id: string;
  quantity: number;
  notes?: string;
}

export interface StockAdjustmentDto {
  warehouse_id: string;
  item_id: string;
  new_quantity: number;
  reason: string;
}

export interface InventoryFilterDto {
  warehouse_id?: string;
  item_id?: string;
  movement_type?: string;
  startDate?: string;
  endDate?: string;
}

export interface InventoryStatistics {
  total_items: number;
  total_stock_value: number;
  low_stock_items: number;
  out_of_stock_items: number;
  warehouses_count: number;
}

export interface InventoryValuation {
  item_id: string;
  item: any;
  total_quantity: number;
  average_cost: number;
  total_value: number;
}

const inventoryService = {
  async getStockLevels(filters?: InventoryFilterDto): Promise<StockLevel[]> {
    const response = await apiClient.get('/inventory/stock-levels', { params: filters });
    return response.data;
  },

  async getItemStockLevel(itemId: string, warehouseId?: string): Promise<StockLevel | StockLevel[]> {
    const params = warehouseId ? { warehouseId } : {};
    const response = await apiClient.get(`/inventory/stock-levels/${itemId}`, { params });
    return response.data;
  },

  async getStockMovements(filters?: InventoryFilterDto): Promise<StockMovement[]> {
    const response = await apiClient.get('/inventory/movements', { params: filters });
    return response.data;
  },

  async getLowStockItems(): Promise<StockLevel[]> {
    const response = await apiClient.get('/inventory/low-stock');
    return response.data;
  },

  async getStatistics(): Promise<InventoryStatistics> {
    const response = await apiClient.get('/inventory/statistics');
    return response.data;
  },

  async getInventoryValuation(): Promise<InventoryValuation[]> {
    const response = await apiClient.get('/inventory/valuation');
    return response.data;
  },

  async createMovement(data: CreateStockMovementDto): Promise<StockMovement> {
    const response = await apiClient.post('/inventory/movements', data);
    return response.data;
  },

  async stockIn(data: CreateStockMovementDto): Promise<StockMovement> {
    const response = await apiClient.post('/inventory/stock-in', data);
    return response.data;
  },

  async stockOut(data: CreateStockMovementDto): Promise<StockMovement> {
    const response = await apiClient.post('/inventory/stock-out', data);
    return response.data;
  },

  async transfer(data: StockTransferDto): Promise<{ from: StockMovement; to: StockMovement }> {
    const response = await apiClient.post('/inventory/transfer', data);
    return response.data;
  },

  async adjustment(data: StockAdjustmentDto): Promise<StockMovement> {
    const response = await apiClient.post('/inventory/adjustment', data);
    return response.data;
  },
};

export default inventoryService;
