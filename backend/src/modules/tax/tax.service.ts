import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AuditService } from '../../shared/audit/audit.service';
import { CreateTaxDto, UpdateTaxDto } from './dto';

@Injectable()
export class TaxService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(company_id: string, user_id: string, createTaxDto: CreateTaxDto) {
    const tax = await this.prisma.taxes.create({
      data: {
        id: randomUUID(),
        ...createTaxDto,
        company_id,
        updated_at: new Date(),
      },
    });

    await this.audit.log({
      companyId: company_id,
      userId: user_id,
      action: 'create' as any,
      entity_type: 'tax',
      entityId: tax.id,
      newValues: tax,
    });

    return tax;
  }

  async findAll(company_id: string, activeOnly: boolean = false) {
    const where: any = { company_id };
    
    if (activeOnly) {
      where.is_active = true;
    }

    return this.prisma.taxes.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, company_id: string) {
    const tax = await this.prisma.taxes.findUnique({
      where: { id },
    });

    if (!tax) {
      throw new NotFoundException(`Tax with ID ${id} not found`);
    }

    if (tax.company_id !== company_id) {
      throw new ForbiddenException('Access denied to this tax');
    }

    return tax;
  }

  async update(
    id: string,
    company_id: string,
    user_id: string,
    updateTaxDto: UpdateTaxDto,
  ) {
    const existingTax = await this.findOne(id, company_id);

    const tax = await this.prisma.taxes.update({
      where: { id },
      data: updateTaxDto,
    });

    await this.audit.log({
      companyId: company_id,
      userId: user_id,
      action: 'update' as any,
      entity_type: 'tax',
      entityId: tax.id,
      oldValues: existingTax,
      newValues: tax,
    });

    return tax;
  }

  async remove(id: string, company_id: string, user_id: string) {
    const tax = await this.findOne(id, company_id);

    // Soft delete
    await this.prisma.taxes.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    await this.audit.log({
      companyId: company_id,
      userId: user_id,
      action: 'delete' as any,
      entity_type: 'tax',
      entityId: tax.id,
      oldValues: tax,
    });

    return { message: 'Tax deleted successfully' };
  }

  /**
   * Calculate tax amount for a given base amount
   */
  calculateTax(baseAmount: number, taxRate: number): number {
    return Number((baseAmount * (taxRate / 100)).toFixed(2));
  }

  /**
   * Calculate total amount including tax
   */
  calculateTotalWithTax(baseAmount: number, taxRate: number): number {
    return Number((baseAmount + this.calculateTax(baseAmount, taxRate)).toFixed(2));
  }

  /**
   * Calculate multiple taxes on a base amount
   */
  async calculateMultipleTaxes(
    company_id: string,
    baseAmount: number,
    taxIds: string[],
  ): Promise<{ tax_id: string; taxName: string; rate: number; amount: number }[]> {
    const taxes = await this.prisma.taxes.findMany({
      where: {
        id: { in: taxIds },
        company_id,
        is_active: true,
      },
    });

    return taxes.map((tax: any) => ({
      tax_id: tax.id,
      taxName: tax.name,
      rate: tax.rate,
      amount: this.calculateTax(baseAmount, tax.rate),
    }));
  }
}

