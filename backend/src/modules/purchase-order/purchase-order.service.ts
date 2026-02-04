import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto, POFilterDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PurchaseOrderService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, userId: string, createDto: CreatePurchaseOrderDto) {
    const poNumber = await this.generatePONumber(companyId);

    // Calculate totals
    let subtotal = 0;
    let taxTotal = 0;

    createDto.lines.forEach((line) => {
      const lineTotal = line.quantity * line.unit_price;
      subtotal += lineTotal;
      taxTotal += line.tax_amount || 0;
    });

    const total = subtotal + taxTotal;

    return this.prisma.purchase_orders.create({
      data: {
        po_number: poNumber,
        company_id: companyId,
        vendor_id: createDto.vendor_id,
        order_date: new Date(createDto.order_date),
        expected_date: createDto.expected_date ? new Date(createDto.expected_date) : null,
        currency_code: createDto.currency_code || 'USD',
        subtotal,
        tax_total: taxTotal,
        total,
        status: 'draft',
        notes: createDto.notes,
        terms: createDto.terms,
        created_by: userId,
        po_lines: {
          create: createDto.lines.map((line, index) => ({
            line_number: index + 1,
            item_id: line.item_id,
            description: line.description,
            quantity: line.quantity,
            unit_price: line.unit_price,
            tax_amount: line.tax_amount || 0,
            total: line.quantity * line.unit_price,
            received_qty: 0,
          })),
        },
      },
      include: {
        po_lines: {
          include: {
            items: true,
          },
        },
        vendors: true,
      },
    });
  }

  async findAll(companyId: string, filter: POFilterDto) {
    const where: Prisma.purchase_ordersWhereInput = {
      company_id: companyId,
      deleted_at: null,
    };

    if (filter.status) {
      where.status = filter.status as any;
    }

    if (filter.vendor_id) {
      where.vendor_id = filter.vendor_id;
    }

    if (filter.startDate || filter.endDate) {
      const dateFilter: any = {};
      if (filter.startDate) {
        dateFilter.gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        dateFilter.lte = new Date(filter.endDate);
      }
      where.order_date = dateFilter;
    }

    return this.prisma.purchase_orders.findMany({
      where,
      include: {
        vendors: true,
        po_lines: true,
      },
      orderBy: { order_date: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const po = await this.prisma.purchase_orders.findFirst({
      where: {
        id,
        company_id: companyId,
        deleted_at: null,
      },
      include: {
        vendors: true,
        po_lines: {
          include: {
            items: true,
          },
        },
        goods_receipts: true,
      },
    });

    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }

    return po;
  }

  async update(companyId: string, id: string, updateDto: UpdatePurchaseOrderDto) {
    const po = await this.findOne(companyId, id);

    if (po.status !== 'draft') {
      throw new BadRequestException('Can only update draft purchase orders');
    }

    // If lines are being updated, recalculate totals
    let dataToUpdate: any = {
      expected_date: updateDto.expected_date ? new Date(updateDto.expected_date) : undefined,
      notes: updateDto.notes,
      terms: updateDto.terms,
    };

    if (updateDto.lines) {
      let subtotal = 0;
      let taxTotal = 0;

      updateDto.lines.forEach((line) => {
        const lineTotal = line.quantity * line.unit_price;
        subtotal += lineTotal;
        taxTotal += line.tax_amount || 0;
      });

      const total = subtotal + taxTotal;

      // Delete existing lines and create new ones
      await this.prisma.purchase_order_lines.deleteMany({
        where: { po_id: id },
      });

      dataToUpdate = {
        ...dataToUpdate,
        subtotal,
        tax_total: taxTotal,
        total,
        po_lines: {
          create: updateDto.lines.map((line, index) => ({
            line_number: index + 1,
            item_id: line.item_id,
            description: line.description,
            quantity: line.quantity,
            unit_price: line.unit_price,
            tax_amount: line.tax_amount || 0,
            total: line.quantity * line.unit_price,
            received_qty: 0,
          })),
        },
      };
    }

    return this.prisma.purchase_orders.update({
      where: { id },
      data: dataToUpdate,
      include: {
        vendors: true,
        po_lines: {
          include: {
            items: true,
          },
        },
      },
    });
  }

  async submit(companyId: string, id: string) {
    const po = await this.findOne(companyId, id);

    if (po.status !== 'draft') {
      throw new BadRequestException('Can only submit draft purchase orders');
    }

    return this.prisma.purchase_orders.update({
      where: { id },
      data: { status: 'submitted' },
    });
  }

  async approve(companyId: string, id: string, userId: string) {
    const po = await this.findOne(companyId, id);

    if (po.status !== 'submitted') {
      throw new BadRequestException('Can only approve submitted purchase orders');
    }

    return this.prisma.purchase_orders.update({
      where: { id },
      data: {
        status: 'approved',
        approved_by: userId,
        approved_at: new Date(),
      },
    });
  }

  async reject(companyId: string, id: string) {
    const po = await this.findOne(companyId, id);

    if (po.status !== 'submitted') {
      throw new BadRequestException('Can only reject submitted purchase orders');
    }

    return this.prisma.purchase_orders.update({
      where: { id },
      data: { status: 'rejected' },
    });
  }

  async cancel(companyId: string, id: string) {
    const po = await this.findOne(companyId, id);

    if (po.status === 'received' || po.status === 'cancelled') {
      throw new BadRequestException('Cannot cancel received or already cancelled purchase orders');
    }

    return this.prisma.purchase_orders.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }

  async getStatistics(companyId: string) {
    const totalPOs = await this.prisma.purchase_orders.count({
      where: { company_id: companyId, deleted_at: null },
    });

    const draftPOs = await this.prisma.purchase_orders.count({
      where: { company_id: companyId, deleted_at: null, status: 'draft' },
    });

    const approvedPOs = await this.prisma.purchase_orders.count({
      where: { company_id: companyId, deleted_at: null, status: 'approved' },
    });

    const totalValue = await this.prisma.purchase_orders.aggregate({
      where: {
        company_id: companyId,
        deleted_at: null,
        status: { in: ['approved', 'partially_received', 'received'] },
      },
      _sum: { total: true },
    });

    return {
      totalPOs,
      draftPOs,
      approvedPOs,
      totalValue: totalValue._sum.total || 0,
    };
  }

  private async generatePONumber(companyId: string): Promise<string> {
    const prefix = 'PO';
    const lastPO = await this.prisma.purchase_orders.findFirst({
      where: {
        company_id: companyId,
        po_number: {
          startsWith: prefix,
        },
      },
      orderBy: { po_number: 'desc' },
    });

    if (!lastPO) {
      return `${prefix}-00001`;
    }

    const lastNumber = parseInt(lastPO.po_number.split('-')[1]);
    const nextNumber = lastNumber + 1;
    return `${prefix}-${nextNumber.toString().padStart(5, '0')}`;
  }
}
