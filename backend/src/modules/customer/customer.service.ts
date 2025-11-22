import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AuditService } from '../../shared/audit/audit.service';
import { CreateCustomerDto, UpdateCustomerDto, QueryCustomerDto } from './dto';

@Injectable()
export class CustomerService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(
    companyId: string,
    userId: string,
    createCustomerDto: CreateCustomerDto,
  ) {
    // Get the next customer number
    const lastCustomer = await this.prisma.customers.findFirst({
      where: { company_id: companyId },
      orderBy: { customer_number: 'desc' },
    });

    const nextNumber = lastCustomer
      ? parseInt(lastCustomer.customer_number.replace(/\D/g, '')) + 1
      : 1;
    const customerNumber = `CUST-${nextNumber.toString().padStart(5, '0')}`;

    const customer = await this.prisma.customers.create({
      data: {
        id: randomUUID(),
        customer_number: customerNumber,
        company_id: companyId,
        name: createCustomerDto.name,
        customer_type: createCustomerDto.customerType,
        email: createCustomerDto.email,
        phone: createCustomerDto.phone,
        billing_address_line1: createCustomerDto.billingAddressLine1,
        billing_address_line2: createCustomerDto.billingAddressLine2,
        billing_city: createCustomerDto.billingCity,
        billing_state: createCustomerDto.billingState,
        billing_postal_code: createCustomerDto.billingPostalCode,
        billing_country: createCustomerDto.billingCountry,
        shipping_address_line1: createCustomerDto.shippingAddressLine1,
        shipping_address_line2: createCustomerDto.shippingAddressLine2,
        shipping_city: createCustomerDto.shippingCity,
        shipping_state: createCustomerDto.shippingState,
        shipping_postal_code: createCustomerDto.shippingPostalCode,
        shipping_country: createCustomerDto.shippingCountry,
        tax_id: createCustomerDto.taxNumber,
        notes: createCustomerDto.notes,
        updated_at: new Date(),
      },
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'create' as any,
      entity_type: 'customer',
      entityId: customer.id,
      newValues: customer,
    });

    return customer;
  }

  async findAll(companyId: string, query: QueryCustomerDto) {
    const { search, type, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { company_id: companyId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { customer_number: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.customer_type = type;
    }

    const [customers, total] = await Promise.all([
      this.prisma.customers.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.customers.count({ where }),
    ]);

    return {
      data: customers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, companyId: string) {
    const customer = await this.prisma.customers.findUnique({
      where: { id },
      include: {
        quotes: {
          take: 5,
          orderBy: { created_at: 'desc' },
        },
        invoices: {
          take: 5,
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    if (customer.company_id !== companyId) {
      throw new ForbiddenException('Access denied to this customer');
    }

    return customer;
  }

  async update(
    id: string,
    companyId: string,
    userId: string,
    updateCustomerDto: UpdateCustomerDto,
  ) {
    const existingCustomer = await this.findOne(id, companyId);

    const updateData: any = {
      updated_at: new Date(),
    };

    // Map camelCase DTO fields to snake_case database fields
    if (updateCustomerDto.name !== undefined) updateData.name = updateCustomerDto.name;
    if (updateCustomerDto.customerType !== undefined) updateData.customer_type = updateCustomerDto.customerType;
    if (updateCustomerDto.email !== undefined) updateData.email = updateCustomerDto.email;
    if (updateCustomerDto.phone !== undefined) updateData.phone = updateCustomerDto.phone;
    if (updateCustomerDto.billingAddressLine1 !== undefined) updateData.billing_address_line1 = updateCustomerDto.billingAddressLine1;
    if (updateCustomerDto.billingAddressLine2 !== undefined) updateData.billing_address_line2 = updateCustomerDto.billingAddressLine2;
    if (updateCustomerDto.billingCity !== undefined) updateData.billing_city = updateCustomerDto.billingCity;
    if (updateCustomerDto.billingState !== undefined) updateData.billing_state = updateCustomerDto.billingState;
    if (updateCustomerDto.billingPostalCode !== undefined) updateData.billing_postal_code = updateCustomerDto.billingPostalCode;
    if (updateCustomerDto.billingCountry !== undefined) updateData.billing_country = updateCustomerDto.billingCountry;
    if (updateCustomerDto.shippingAddressLine1 !== undefined) updateData.shipping_address_line1 = updateCustomerDto.shippingAddressLine1;
    if (updateCustomerDto.shippingAddressLine2 !== undefined) updateData.shipping_address_line2 = updateCustomerDto.shippingAddressLine2;
    if (updateCustomerDto.shippingCity !== undefined) updateData.shipping_city = updateCustomerDto.shippingCity;
    if (updateCustomerDto.shippingState !== undefined) updateData.shipping_state = updateCustomerDto.shippingState;
    if (updateCustomerDto.shippingPostalCode !== undefined) updateData.shipping_postal_code = updateCustomerDto.shippingPostalCode;
    if (updateCustomerDto.shippingCountry !== undefined) updateData.shipping_country = updateCustomerDto.shippingCountry;
    if (updateCustomerDto.taxNumber !== undefined) updateData.tax_id = updateCustomerDto.taxNumber;
    if (updateCustomerDto.notes !== undefined) updateData.notes = updateCustomerDto.notes;

    const customer = await this.prisma.customers.update({
      where: { id },
      data: updateData,
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'update' as any,
      entity_type: 'customer',
      entityId: customer.id,
      oldValues: existingCustomer,
      newValues: customer,
    });

    return customer;
  }

  async remove(id: string, companyId: string, userId: string) {
    const customer = await this.findOne(id, companyId);

    // Soft delete
    await this.prisma.customers.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    await this.audit.log({
      companyId,
      userId,
      action: 'delete' as any,
      entity_type: 'customer',
      entityId: customer.id,
      oldValues: customer,
    });

    return { message: 'Customer deleted successfully' };
  }

  async getStats(companyId: string) {
    const [total, business, individual] = await Promise.all([
      this.prisma.customers.count({ where: { company_id: companyId } }),
      this.prisma.customers.count({ 
        where: { company_id: companyId, customer_type: 'business' } 
      }),
      this.prisma.customers.count({ 
        where: { company_id: companyId, customer_type: 'individual' } 
      }),
    ]);

    return {
      total,
      business,
      individual,
    };
  }
}

