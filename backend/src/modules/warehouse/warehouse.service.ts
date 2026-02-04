import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateWarehouseDto, UpdateWarehouseDto, WarehouseFilterDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class WarehouseService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, createDto: CreateWarehouseDto) {
    // Check if code already exists
    const existing = await this.prisma.warehouses.findFirst({
      where: {
        company_id: companyId,
        code: createDto.code,
        deleted_at: null,
      },
    });

    if (existing) {
      throw new BadRequestException('Warehouse code already exists');
    }

    return this.prisma.warehouses.create({
      data: {
        ...createDto,
        company_id: companyId,
      },
    });
  }

  async findAll(companyId: string, filter: WarehouseFilterDto) {
    const where: Prisma.warehousesWhereInput = {
      company_id: companyId,
      deleted_at: null,
    };

    if (filter.is_active !== undefined) {
      where.is_active = filter.is_active;
    }

    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { code: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.warehouses.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const warehouse = await this.prisma.warehouses.findFirst({
      where: {
        id,
        company_id: companyId,
        deleted_at: null,
      },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    return warehouse;
  }

  async getStockLevels(companyId: string, warehouseId: string) {
    await this.findOne(companyId, warehouseId);

    return this.prisma.stock_levels.findMany({
      where: {
        warehouse_id: warehouseId,
        company_id: companyId,
      },
      include: {
        items: true,
      },
      orderBy: {
        items: {
          name: 'asc',
        },
      },
    });
  }

  async update(companyId: string, id: string, updateDto: UpdateWarehouseDto) {
    await this.findOne(companyId, id);

    return this.prisma.warehouses.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);

    // Check if warehouse has stock
    const hasStock = await this.prisma.stock_levels.count({
      where: {
        warehouse_id: id,
        quantity: { gt: 0 },
      },
    });

    if (hasStock > 0) {
      throw new BadRequestException(
        'Cannot delete warehouse with existing stock. Transfer stock first.',
      );
    }

    return this.prisma.warehouses.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }
}
