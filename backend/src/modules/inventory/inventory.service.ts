import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  CreateStockMovementDto,
  StockAdjustmentDto,
  StockTransferDto,
  InventoryFilterDto,
} from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getStockLevels(companyId: string, filter: InventoryFilterDto) {
    const where: Prisma.stock_levelsWhereInput = {
      company_id: companyId,
    };

    if (filter.warehouse_id) {
      where.warehouse_id = filter.warehouse_id;
    }

    if (filter.item_id) {
      where.item_id = filter.item_id;
    }

    return this.prisma.stock_levels.findMany({
      where,
      include: {
        items: true,
        warehouses: true,
      },
      orderBy: { updated_at: 'desc' },
    });
  }

  async getItemStockLevel(
    companyId: string,
    itemId: string,
    warehouseId?: string,
  ) {
    const where: Prisma.stock_levelsWhereInput = {
      company_id: companyId,
      item_id: itemId,
    };

    if (warehouseId) {
      where.warehouse_id = warehouseId;
    }

    const stockLevels = await this.prisma.stock_levels.findMany({
      where,
      include: {
        warehouses: true,
      },
    });

    const totalQuantity = stockLevels.reduce(
      (sum, stock) => sum + Number(stock.quantity),
      0,
    );
    const totalAvailable = stockLevels.reduce(
      (sum, stock) => sum + Number(stock.available_qty),
      0,
    );
    const totalReserved = stockLevels.reduce(
      (sum, stock) => sum + Number(stock.reserved_qty),
      0,
    );

    return {
      itemId,
      warehouseId,
      stockLevels,
      totals: {
        quantity: totalQuantity,
        available: totalAvailable,
        reserved: totalReserved,
      },
    };
  }

  async getStockMovements(companyId: string, filter: InventoryFilterDto) {
    const where: Prisma.stock_movementsWhereInput = {
      company_id: companyId,
    };

    if (filter.warehouse_id) {
      where.warehouse_id = filter.warehouse_id;
    }

    if (filter.item_id) {
      where.item_id = filter.item_id;
    }

    if (filter.movement_type) {
      where.movement_type = filter.movement_type as any;
    }

    if (filter.startDate || filter.endDate) {
      const dateFilter: any = {};
      if (filter.startDate) {
        dateFilter.gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        dateFilter.lte = new Date(filter.endDate);
      }
      where.movement_date = dateFilter;
    }

    return this.prisma.stock_movements.findMany({
      where,
      include: {
        items: true,
        warehouses: true,
        users: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
      orderBy: { movement_date: 'desc' },
      take: 100,
    });
  }

  async getLowStockItems(companyId: string) {
    const lowStock = await this.prisma.$queryRaw`
      SELECT sl.*, i.name as item_name, w.name as warehouse_name
      FROM stock_levels sl
      JOIN items i ON sl.item_id = i.id
      JOIN warehouses w ON sl.warehouse_id = w.id
      WHERE sl.company_id = ${companyId}::uuid
      AND sl.reorder_point IS NOT NULL
      AND sl.available_qty <= sl.reorder_point
      ORDER BY sl.available_qty ASC
    `;

    return lowStock;
  }

  async createMovement(
    companyId: string,
    userId: string,
    createDto: CreateStockMovementDto,
  ) {
    // Create movement record
    const movement = await this.prisma.stock_movements.create({
      data: {
        company_id: companyId,
        movement_type: createDto.movement_type as any,
        reference_type: createDto.reference_type,
        reference_id: createDto.reference_id,
        warehouse_id: createDto.warehouse_id,
        item_id: createDto.item_id,
        quantity: createDto.quantity,
        unit_cost: createDto.unit_cost,
        notes: createDto.notes,
        created_by: userId,
      },
      include: {
        items: true,
        warehouses: true,
      },
    });

    // Update stock level
    await this.updateStockLevel(
      companyId,
      createDto.warehouse_id,
      createDto.item_id,
      createDto.quantity,
      createDto.movement_type,
    );

    return movement;
  }

  async stockIn(
    companyId: string,
    userId: string,
    createDto: CreateStockMovementDto,
  ) {
    return this.createMovement(companyId, userId, {
      ...createDto,
      movement_type: 'IN',
    });
  }

  async stockOut(
    companyId: string,
    userId: string,
    createDto: CreateStockMovementDto,
  ) {
    // Check available stock
    const stockLevel = await this.prisma.stock_levels.findFirst({
      where: {
        company_id: companyId,
        warehouse_id: createDto.warehouse_id,
        item_id: createDto.item_id,
      },
    });

    if (!stockLevel || Number(stockLevel.available_qty) < createDto.quantity) {
      throw new BadRequestException('Insufficient stock available');
    }

    return this.createMovement(companyId, userId, {
      ...createDto,
      movement_type: 'OUT',
    });
  }

  async transfer(
    companyId: string,
    userId: string,
    transferDto: StockTransferDto,
  ) {
    // Check source warehouse stock
    const sourceStock = await this.prisma.stock_levels.findFirst({
      where: {
        company_id: companyId,
        warehouse_id: transferDto.from_warehouse_id,
        item_id: transferDto.item_id,
      },
    });

    if (!sourceStock || Number(sourceStock.available_qty) < transferDto.quantity) {
      throw new BadRequestException('Insufficient stock in source warehouse');
    }

    // Create OUT movement from source
    await this.createMovement(companyId, userId, {
      movement_type: 'OUT',
      warehouse_id: transferDto.from_warehouse_id,
      item_id: transferDto.item_id,
      quantity: transferDto.quantity,
      reference_type: 'transfer',
      notes: `Transfer to warehouse ${transferDto.to_warehouse_id}`,
    });

    // Create IN movement to destination
    await this.createMovement(companyId, userId, {
      movement_type: 'IN',
      warehouse_id: transferDto.to_warehouse_id,
      item_id: transferDto.item_id,
      quantity: transferDto.quantity,
      reference_type: 'transfer',
      notes: `Transfer from warehouse ${transferDto.from_warehouse_id}`,
    });

    return { success: true, message: 'Stock transferred successfully' };
  }

  async adjustment(
    companyId: string,
    userId: string,
    adjustmentDto: StockAdjustmentDto,
  ) {
    const currentStock = await this.prisma.stock_levels.findFirst({
      where: {
        company_id: companyId,
        warehouse_id: adjustmentDto.warehouse_id,
        item_id: adjustmentDto.item_id,
      },
    });

    if (!currentStock) {
      throw new NotFoundException('Stock level not found');
    }

    const difference = adjustmentDto.new_quantity - Number(currentStock.quantity);
    const movementType = difference > 0 ? 'IN' : 'OUT';
    const quantity = Math.abs(difference);

    // Create adjustment movement
    await this.createMovement(companyId, userId, {
      movement_type: 'ADJUSTMENT',
      warehouse_id: adjustmentDto.warehouse_id,
      item_id: adjustmentDto.item_id,
      quantity,
      notes: `Stock adjustment: ${adjustmentDto.reason}`,
    });

    return { success: true, message: 'Stock adjusted successfully' };
  }

  async updateReorderPoint(
    companyId: string,
    itemId: string,
    warehouseId: string,
    reorderPoint: number,
    reorderQuantity: number,
  ) {
    const stockLevel = await this.prisma.stock_levels.findFirst({
      where: {
        company_id: companyId,
        warehouse_id: warehouseId,
        item_id: itemId,
      },
    });

    if (!stockLevel) {
      throw new NotFoundException('Stock level not found');
    }

    return this.prisma.stock_levels.update({
      where: { id: stockLevel.id },
      data: {
        reorder_point: reorderPoint,
        reorder_quantity: reorderQuantity,
      },
    });
  }

  async getStatistics(companyId: string) {
    const totalItems = await this.prisma.stock_levels.count({
      where: { company_id: companyId },
    });

    const totalQuantity = await this.prisma.stock_levels.aggregate({
      where: { company_id: companyId },
      _sum: { quantity: true },
    });

    const lowStockCount = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM stock_levels
      WHERE company_id = ${companyId}::uuid
      AND reorder_point IS NOT NULL
      AND available_qty <= reorder_point
    `;

    return {
      totalItems,
      totalQuantity: totalQuantity._sum.quantity || 0,
      lowStockItems: Number(lowStockCount[0]?.count || 0),
    };
  }

  async getInventoryValuation(companyId: string) {
    const valuation = await this.prisma.$queryRaw<any[]>`
      SELECT 
        i.id,
        i.name,
        i.cost_price,
        SUM(sl.quantity) as total_quantity,
        SUM(sl.quantity * COALESCE(i.cost_price, 0)) as total_value
      FROM items i
      LEFT JOIN stock_levels sl ON i.id = sl.item_id AND sl.company_id = ${companyId}::uuid
      WHERE i.company_id = ${companyId}::uuid
      GROUP BY i.id, i.name, i.cost_price
      HAVING SUM(sl.quantity) > 0
      ORDER BY total_value DESC
    `;

    const totalValue = valuation.reduce(
      (sum, item) => sum + Number(item.total_value || 0),
      0,
    );

    return {
      items: valuation,
      totalValue,
    };
  }

  private async updateStockLevel(
    companyId: string,
    warehouseId: string,
    itemId: string,
    quantity: number,
    movementType: string,
  ) {
    const existing = await this.prisma.stock_levels.findFirst({
      where: {
        company_id: companyId,
        warehouse_id: warehouseId,
        item_id: itemId,
      },
    });

    const quantityChange =
      movementType === 'IN' || movementType === 'ADJUSTMENT' ? quantity : -quantity;

    if (existing) {
      const newQuantity = Number(existing.quantity) + quantityChange;
      const newAvailable = Number(existing.available_qty) + quantityChange;

      await this.prisma.stock_levels.update({
        where: { id: existing.id },
        data: {
          quantity: newQuantity,
          available_qty: newAvailable,
        },
      });
    } else {
      await this.prisma.stock_levels.create({
        data: {
          company_id: companyId,
          warehouse_id: warehouseId,
          item_id: itemId,
          quantity: quantityChange > 0 ? quantityChange : 0,
          available_qty: quantityChange > 0 ? quantityChange : 0,
          reserved_qty: 0,
        },
      });
    }
  }
}
