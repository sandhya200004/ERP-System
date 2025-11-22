import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AuditService } from '../../shared/audit/audit.service';

@Injectable()
export class CompanyService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findOne(id: string, user_id: string) {
    const company = await this.prisma.companies.findFirst({
      where: {
        id,
        user_roles: {
          some: {
            user_id,
          },
        },
      },
      include: {
        branches: {
          where: { deleted_at: null },
        },
        _count: {
          select: {
            user_roles: true,
            customers: true,
            invoices: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async update(id: string, user_id: string, data: any) {
    // Verify user has access
    await this.findOne(id, user_id);

    const updated = await this.prisma.companies.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    await this.audit.log({
      companyId: id,
      userId: user_id,
      action: 'update' as any,
      entity_type: 'company',
      entityId: id,
      newValues: data,
    });

    return updated;
  }

  async getStats(company_id: string) {
    const [
      totalCustomers,
      totalInvoices,
      totalRevenue,
      pendingPayments,
    ] = await Promise.all([
      this.prisma.customers.count({
        where: { company_id, deleted_at: null },
      }),
      this.prisma.invoices.count({
        where: { company_id, deleted_at: null },
      }),
      this.prisma.invoices.aggregate({
        where: {
          company_id,
          status: 'paid',
          deleted_at: null,
        },
        _sum: {
          total: true,
        },
      }),
      this.prisma.invoices.aggregate({
        where: {
          company_id,
          status: { in: ['sent', 'partially_paid', 'overdue'] },
          deleted_at: null,
        },
        _sum: {
          amount_due: true,
        },
      }),
    ]);

    return {
      totalCustomers,
      totalInvoices,
      totalRevenue: totalRevenue._sum.total || 0,
      pendingPayments: pendingPayments._sum.amount_due || 0,
    };
  }
}
