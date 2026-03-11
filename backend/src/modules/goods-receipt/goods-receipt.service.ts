import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateGoodsReceiptDto, UpdateGoodsReceiptDto, GRNFilterDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class GoodsReceiptService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, userId: string, createDto: CreateGoodsReceiptDto) {
    const grnNumber = await this.generateGRNNumber(companyId);

    // Verify PO if provided
    if (createDto.po_id) {
      const po = await this.prisma.purchase_orders.findFirst({
        where: {
          id: createDto.po_id,
          company_id: companyId,
          deleted_at: null,
        },
        include: {
          po_lines: true,
        },
      });

      if (!po) {
        throw new NotFoundException('Purchase order not found');
      }

      if (po.status !== 'approved') {
        throw new BadRequestException('Can only receive from approved purchase orders');
      }
    }

    // Create GRN with transaction to update stock levels
    return this.prisma.$transaction(async (tx) => {
      const grn = await tx.goods_receipts.create({
        data: {
          grn_number: grnNumber,
          company_id: companyId,
          po_id: createDto.po_id,
          vendor_id: createDto.vendor_id,
          receipt_date: new Date(createDto.receipt_date),
          status: 'draft',
          notes: createDto.notes,
          received_by: userId,
          grn_lines: {
            create: createDto.lines.map((line, index) => ({
              line_number: index + 1,
              item_id: line.item_id,
              description: line.description,
              ordered_qty: line.ordered_qty,
              received_qty: line.received_qty,
              warehouse_id: line.warehouse_id,
              location: line.location,
              notes: line.notes,
            })),
          },
        },
        include: {
          grn_lines: {
            include: {
              items: true,
              warehouses: true,
            },
          },
          vendors: true,
          purchase_orders: true,
        },
      });

      return grn;
    });
  }

  async findAll(companyId: string, filter: GRNFilterDto) {
    const where: Prisma.goods_receiptsWhereInput = {
      company_id: companyId,
    };

    if (filter.status) {
      where.status = filter.status as any;
    }

    if (filter.vendor_id) {
      where.vendor_id = filter.vendor_id;
    }

    if (filter.po_id) {
      where.po_id = filter.po_id;
    }

    if (filter.startDate || filter.endDate) {
      const dateFilter: any = {};
      if (filter.startDate) {
        dateFilter.gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        dateFilter.lte = new Date(filter.endDate);
      }
      where.receipt_date = dateFilter;
    }

    return this.prisma.goods_receipts.findMany({
      where,
      include: {
        vendors: true,
        grn_lines: {
          include: {
            items: true,
            warehouses: true,
          },
        },
        purchase_orders: true,
      },
      orderBy: { receipt_date: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const grn = await this.prisma.goods_receipts.findFirst({
      where: {
        id,
        company_id: companyId,
      },
      include: {
        grn_lines: {
          include: {
            items: true,
            warehouses: true,
          },
        },
        vendors: true,
        purchase_orders: {
          include: {
            po_lines: true,
          },
        },
        users: true,
      },
    });

    if (!grn) {
      throw new NotFoundException('Goods receipt not found');
    }

    return grn;
  }

  async update(companyId: string, id: string, updateDto: UpdateGoodsReceiptDto) {
    const grn = await this.findOne(companyId, id);

    if (grn.status !== 'draft') {
      throw new BadRequestException('Can only update draft goods receipts');
    }

    return this.prisma.goods_receipts.update({
      where: { id },
      data: {
        receipt_date: updateDto.receipt_date ? new Date(updateDto.receipt_date) : undefined,
        notes: updateDto.notes,
        grn_lines: updateDto.lines
          ? {
              deleteMany: {},
              create: updateDto.lines.map((line, index) => ({
                line_number: index + 1,
                item_id: line.item_id,
                description: line.description,
                ordered_qty: line.ordered_qty,
                received_qty: line.received_qty,
                warehouse_id: line.warehouse_id,
                location: line.location,
                notes: line.notes,
              })),
            }
          : undefined,
      },
      include: {
        grn_lines: {
          include: {
            items: true,
            warehouses: true,
          },
        },
        vendors: true,
        purchase_orders: true,
      },
    });
  }

  async confirm(companyId: string, id: string) {
    const grn = await this.findOne(companyId, id);

    if (grn.status !== 'draft') {
      throw new BadRequestException('Can only confirm draft goods receipts');
    }

    // Use transaction to update stock levels and GRN status
    return this.prisma.$transaction(async (tx) => {
      // Update stock levels for each line
      for (const line of grn.grn_lines) {
        if (line.item_id && line.warehouse_id) {
          // Find or create stock level
          const stockLevel = await tx.stock_levels.findFirst({
            where: {
              company_id: companyId,
              item_id: line.item_id,
              warehouse_id: line.warehouse_id,
            },
          });

          if (stockLevel) {
            await tx.stock_levels.update({
              where: { id: stockLevel.id },
              data: {
                quantity: {
                  increment: line.received_qty,
                },
                available_qty: {
                  increment: line.received_qty,
                },
              },
            });
          } else {
            await tx.stock_levels.create({
              data: {
                company_id: companyId,
                item_id: line.item_id,
                warehouse_id: line.warehouse_id,
                quantity: line.received_qty,
                available_qty: line.received_qty,
                reserved_qty: 0,
                reorder_point: 0,
                reorder_quantity: 0,
              },
            });
          }

          // Create stock movement record
          await tx.stock_movements.create({
            data: {
              company_id: companyId,
              item_id: line.item_id,
              warehouse_id: line.warehouse_id,
              movement_type: 'IN',
              quantity: line.received_qty,
              reference_type: 'GRN',
              reference_id: id,
              notes: `Goods received from ${grn.vendors.name}`,
              movement_date: new Date(),
              created_by: grn.received_by,
            },
          });
        }
      }

      // Update PO line received quantities if linked to PO
      if (grn.po_id) {
        for (const line of grn.grn_lines) {
          if (line.item_id) {
            const poLine = await tx.purchase_order_lines.findFirst({
              where: {
                po_id: grn.po_id,
                item_id: line.item_id,
              },
            });

            if (poLine) {
              await tx.purchase_order_lines.update({
                where: { id: poLine.id },
                data: {
                  received_qty: {
                    increment: line.received_qty,
                  },
                },
              });
            }
          }
        }

        // Check if PO is fully received
        const poLines = await tx.purchase_order_lines.findMany({
          where: { po_id: grn.po_id },
        });

        const fullyReceived = poLines.every(
          (line) => Number(line.received_qty) >= Number(line.quantity),
        );

        await tx.purchase_orders.update({
          where: { id: grn.po_id },
          data: {
            status: fullyReceived ? 'received' : 'partially_received',
          },
        });
      }

      // Update GRN status
      return tx.goods_receipts.update({
        where: { id },
        data: { status: 'completed' },
        include: {
          grn_lines: {
            include: {
              items: true,
              warehouses: true,
            },
          },
          vendors: true,
          purchase_orders: true,
        },
      });
    });
  }

  async cancel(companyId: string, id: string) {
    const grn = await this.findOne(companyId, id);

    if (grn.status === 'cancelled') {
      throw new BadRequestException('Goods receipt already cancelled');
    }

    if (grn.status === 'completed') {
      throw new BadRequestException(
        'Cannot cancel completed goods receipts. Please create adjustment entries.',
      );
    }

    return this.prisma.goods_receipts.update({
      where: { id },
      data: { status: 'cancelled' },
      include: {
        grn_lines: true,
        vendors: true,
        purchase_orders: true,
      },
    });
  }

  async getStatistics(companyId: string) {
    const [totalGRNs, draftGRNs, completedGRNs, thisMonthGRNs] = await Promise.all([
      this.prisma.goods_receipts.count({
        where: { company_id: companyId },
      }),
      this.prisma.goods_receipts.count({
        where: { company_id: companyId, status: 'draft' },
      }),
      this.prisma.goods_receipts.count({
        where: { company_id: companyId, status: 'completed' },
      }),
      this.prisma.goods_receipts.count({
        where: {
          company_id: companyId,
          receipt_date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    return {
      total: totalGRNs,
      draft: draftGRNs,
      completed: completedGRNs,
      thisMonth: thisMonthGRNs,
    };
  }

  private async generateGRNNumber(companyId: string): Promise<string> {
    const lastGRN = await this.prisma.goods_receipts.findFirst({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
    });

    if (!lastGRN) {
      return 'GRN-00001';
    }

    const lastNumber = parseInt(lastGRN.grn_number.split('-')[1]) || 0;
    return `GRN-${String(lastNumber + 1).padStart(5, '0')}`;
  }
}
