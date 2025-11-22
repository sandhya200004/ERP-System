import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AuditService } from '../../shared/audit/audit.service';
import { CreateItemDto, UpdateItemDto, QueryItemDto } from './dto';

@Injectable()
export class ItemService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(company_id: string, user_id: string, createItemDto: CreateItemDto) {
    const { taxIds, ...itemData } = createItemDto;

    // Get the next item number
    const lastItem = await this.prisma.items.findFirst({
      where: { company_id },
      orderBy: { item_number: 'desc' },
    });

    const nextNumber = lastItem
      ? parseInt(lastItem.item_number.replace(/\D/g, '')) + 1
      : 1;
    const itemNumber = `ITEM-${nextNumber.toString().padStart(5, '0')}`;

    // Create item with tax associations
    const item = await this.prisma.items.create({
      data: {
        id: randomUUID(),
        item_number: itemNumber,
        company_id,
        name: createItemDto.name,
        item_type: createItemDto.itemType,
        description: createItemDto.description,
        unit_price: createItemDto.unitPrice,
        unit_of_measure: createItemDto.unit,
        sku: createItemDto.sku,
        is_active: createItemDto.isActive ?? true,
        default_currency_code: 'USD', // Default currency
        updated_at: new Date(),
        item_taxes: taxIds
          ? {
              create: taxIds.map((tax_id) => ({
                id: randomUUID(),
                tax_id: tax_id,
              })),
            }
          : undefined,
      },
      include: {
        item_taxes: {
          include: {
            taxes: true,
          },
        },
      },
    });

    await this.audit.log({
      companyId: company_id,
      userId: user_id,
      action: 'create' as any,
      entity_type: 'item',
      entityId: item.id,
      newValues: item,
    });

    return item;
  }

  async findAll(company_id: string, query: QueryItemDto) {
    const { search, type, isActive, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { company_id };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { item_number: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.item_type = type;
    }

    if (isActive !== undefined) {
      where.is_active = isActive;
    }

    const [items, total] = await Promise.all([
      this.prisma.items.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          item_taxes: {
            include: {
              taxes: true,
            },
          },
        },
      }),
      this.prisma.items.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, company_id: string) {
    const item = await this.prisma.items.findUnique({
      where: { id },
      include: {
        item_taxes: {
          include: {
            taxes: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    if (item.company_id !== company_id) {
      throw new ForbiddenException('Access denied to this item');
    }

    return item;
  }

  async update(
    id: string,
    company_id: string,
    user_id: string,
    updateItemDto: UpdateItemDto,
  ) {
    const existingItem = await this.findOne(id, company_id);
    const { taxIds, ...itemData } = updateItemDto;

    const updateData: any = {
      updated_at: new Date(),
    };

    // Map camelCase DTO fields to snake_case database fields
    if (updateItemDto.name !== undefined) updateData.name = updateItemDto.name;
    if (updateItemDto.itemType !== undefined) updateData.item_type = updateItemDto.itemType;
    if (updateItemDto.description !== undefined) updateData.description = updateItemDto.description;
    if (updateItemDto.unitPrice !== undefined) updateData.unit_price = updateItemDto.unitPrice;
    if (updateItemDto.unit !== undefined) updateData.unit_of_measure = updateItemDto.unit;
    if (updateItemDto.sku !== undefined) updateData.sku = updateItemDto.sku;
    if (updateItemDto.isActive !== undefined) updateData.is_active = updateItemDto.isActive;

    // Handle tax associations
    if (taxIds) {
      updateData.item_taxes = {
        deleteMany: {}, // Remove all existing tax associations
        create: taxIds.map((tax_id) => ({
          id: randomUUID(),
          tax_id: tax_id,
        })),
      };
    }

    // Update item and manage tax associations
    const item = await this.prisma.items.update({
      where: { id },
      data: updateData,
      include: {
        item_taxes: {
          include: {
            taxes: true,
          },
        },
      },
    });

    await this.audit.log({
      companyId: company_id,
      userId: user_id,
      action: 'delete' as any,
      entity_type: 'item',
      entityId: item.id,
      oldValues: existingItem,
      newValues: item,
    });

    return item;
  }

  async remove(id: string, company_id: string, user_id: string) {
    const item = await this.findOne(id, company_id);

    // Soft delete
    await this.prisma.items.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    await this.audit.log({
      companyId: company_id,
      userId: user_id,
      action: 'delete' as any,
      entity_type: 'item',
      entityId: item.id,
      oldValues: item,
    });

    return { message: 'Item deleted successfully' };
  }

  async getStats(company_id: string) {
    const [total, goods, services, active] = await Promise.all([
      this.prisma.items.count({ where: { company_id } }),
      this.prisma.items.count({ where: { company_id, item_type: 'goods' } }),
      this.prisma.items.count({ where: { company_id, item_type: 'service' } }),
      this.prisma.items.count({ where: { company_id, is_active: true } }),
    ]);

    return {
      total,
      goods,
      services,
      active,
      inactive: total - active,
    };
  }
}



