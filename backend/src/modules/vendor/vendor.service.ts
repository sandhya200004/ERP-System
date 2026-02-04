import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateVendorDto, UpdateVendorDto, VendorFilterDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class VendorService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, createDto: CreateVendorDto) {
    // Generate vendor number if not provided
    const vendorNumber = await this.generateVendorNumber(companyId);

    return this.prisma.vendors.create({
      data: {
        ...createDto,
        vendor_number: vendorNumber,
        company_id: companyId,
      },
    });
  }

  async findAll(companyId: string, filter: VendorFilterDto) {
    const where: Prisma.vendorsWhereInput = {
      company_id: companyId,
      deleted_at: null,
    };

    if (filter.is_active !== undefined) {
      where.is_active = filter.is_active;
    }

    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { vendor_number: { contains: filter.search, mode: 'insensitive' } },
        { email: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const vendors = await this.prisma.vendors.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    return vendors;
  }

  async findOne(companyId: string, id: string) {
    const vendor = await this.prisma.vendors.findFirst({
      where: {
        id,
        company_id: companyId,
        deleted_at: null,
      },
      include: {
        purchase_orders: {
          take: 10,
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return vendor;
  }

  async update(companyId: string, id: string, updateDto: UpdateVendorDto) {
    await this.findOne(companyId, id);

    return this.prisma.vendors.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);

    // Check if vendor has any purchase orders
    const hasPOs = await this.prisma.purchase_orders.count({
      where: { vendor_id: id },
    });

    if (hasPOs > 0) {
      throw new BadRequestException(
        'Cannot delete vendor with existing purchase orders. Consider deactivating instead.',
      );
    }

    return this.prisma.vendors.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async getStatistics(companyId: string) {
    const totalVendors = await this.prisma.vendors.count({
      where: { company_id: companyId, deleted_at: null },
    });

    const activeVendors = await this.prisma.vendors.count({
      where: { company_id: companyId, deleted_at: null, is_active: true },
    });

    const totalPurchaseOrders = await this.prisma.purchase_orders.count({
      where: {
        company_id: companyId,
        deleted_at: null,
      },
    });

    const totalPurchaseValue = await this.prisma.purchase_orders.aggregate({
      where: {
        company_id: companyId,
        deleted_at: null,
        status: { in: ['approved', 'partially_received', 'received'] },
      },
      _sum: {
        total: true,
      },
    });

    return {
      totalVendors,
      activeVendors,
      inactiveVendors: totalVendors - activeVendors,
      totalPurchaseOrders,
      totalPurchaseValue: totalPurchaseValue._sum.total || 0,
    };
  }

  private async generateVendorNumber(companyId: string): Promise<string> {
    const prefix = 'VEN';
    const lastVendor = await this.prisma.vendors.findFirst({
      where: {
        company_id: companyId,
        vendor_number: {
          startsWith: prefix,
        },
      },
      orderBy: {
        vendor_number: 'desc',
      },
    });

    if (!lastVendor) {
      return `${prefix}-00001`;
    }

    const lastNumber = parseInt(lastVendor.vendor_number.split('-')[1]);
    const nextNumber = lastNumber + 1;
    return `${prefix}-${nextNumber.toString().padStart(5, '0')}`;
  }
}
