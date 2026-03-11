import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  CreateSupplierInvoiceDto,
  UpdateSupplierInvoiceDto,
  InvoiceFilterDto,
  RecordPaymentDto,
} from './dto';
import { ThreeWayMatchingService } from './three-way-matching.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SupplierInvoiceService {
  private readonly logger = new Logger(SupplierInvoiceService.name);

  constructor(
    private prisma: PrismaService,
    private matchingService: ThreeWayMatchingService,
  ) {}

  async create(
    companyId: string,
    userId: string,
    createDto: CreateSupplierInvoiceDto,
  ) {
    const invoiceNumber = await this.generateInvoiceNumber(companyId);

    // Calculate totals
    let subtotal = 0;
    let taxTotal = 0;

    createDto.lines.forEach((line) => {
      const lineTotal = line.quantity * line.unit_price;
      subtotal += lineTotal;
      taxTotal += line.tax_amount || 0;
    });

    const total = subtotal + taxTotal;

    // Validate PO and GRN if provided
    if (createDto.po_id) {
      const po = await this.prisma.purchase_orders.findFirst({
        where: {
          id: createDto.po_id,
          company_id: companyId,
          deleted_at: null,
        },
      });

      if (!po) {
        throw new NotFoundException('Purchase order not found');
      }

      if (po.status !== 'approved' && po.status !== 'received') {
        throw new BadRequestException(
          'Can only create invoice for approved or received purchase orders',
        );
      }
    }

    if (createDto.grn_id) {
      const grn = await this.prisma.goods_receipts.findFirst({
        where: {
          id: createDto.grn_id,
          company_id: companyId,
        },
      });

      if (!grn) {
        throw new NotFoundException('Goods receipt note not found');
      }
    }

    // Create invoice with lines
    const invoice = await this.prisma.supplier_invoices.create({
      data: {
        invoice_number: invoiceNumber,
        vendor_invoice_number: createDto.vendor_invoice_number,
        company_id: companyId,
        vendor_id: createDto.vendor_id,
        po_id: createDto.po_id,
        grn_id: createDto.grn_id,
        invoice_date: new Date(createDto.invoice_date),
        due_date: new Date(createDto.due_date),
        currency_code: createDto.currency_code || 'USD',
        subtotal,
        tax_total: taxTotal,
        total,
        status: 'pending',
        payment_status: 'unpaid',
        notes: createDto.notes,
        created_by: userId,
        invoice_lines: {
          create: createDto.lines.map((line, index) => ({
            line_number: index + 1,
            po_line_id: line.po_line_id,
            grn_line_id: line.grn_line_id,
            item_id: line.item_id,
            description: line.description,
            quantity: line.quantity,
            unit_price: line.unit_price,
            tax_amount: line.tax_amount || 0,
            total: line.quantity * line.unit_price + (line.tax_amount || 0),
          })),
        },
      },
      include: {
        invoice_lines: true,
        vendors: true,
        purchase_orders: true,
        goods_receipts: true,
        users: true,
      },
    });

    // Perform 3-way matching if PO and GRN are provided
    if (invoice.po_id && invoice.grn_id) {
      try {
        const matchResult = await this.matchingService.performMatch(
          companyId,
          invoice.id,
        );

        await this.matchingService.saveMatchResult(
          companyId,
          invoice.id,
          userId,
          matchResult,
        );

        this.logger.log(
          `3-way match performed for invoice ${invoice.invoice_number}: ${matchResult.match_status}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to perform 3-way match for invoice ${invoice.invoice_number}`,
          error,
        );
      }
    }

    return invoice;
  }

  async findAll(companyId: string, filter?: InvoiceFilterDto) {
    const where: Prisma.supplier_invoicesWhereInput = {
      company_id: companyId,
      deleted_at: null,
    };

    if (filter) {
      if (filter.vendor_id) where.vendor_id = filter.vendor_id;
      if (filter.po_id) where.po_id = filter.po_id;
      if (filter.grn_id) where.grn_id = filter.grn_id;
      if (filter.status) where.status = filter.status;
      if (filter.payment_status) where.payment_status = filter.payment_status;

      if (filter.start_date || filter.end_date) {
        where.invoice_date = {};
        if (filter.start_date)
          where.invoice_date.gte = new Date(filter.start_date);
        if (filter.end_date)
          where.invoice_date.lte = new Date(filter.end_date);
      }

      if (filter.search) {
        where.OR = [
          { invoice_number: { contains: filter.search, mode: 'insensitive' } },
          {
            vendor_invoice_number: {
              contains: filter.search,
              mode: 'insensitive',
            },
          },
        ];
      }
    }

    return this.prisma.supplier_invoices.findMany({
      where,
      include: {
        vendors: true,
        purchase_orders: true,
        goods_receipts: true,
        users: true,
        three_way_matches: true,
      },
      orderBy: {
        invoice_date: 'desc',
      },
    });
  }

  async findOne(companyId: string, id: string) {
    const invoice = await this.prisma.supplier_invoices.findFirst({
      where: {
        id,
        company_id: companyId,
        deleted_at: null,
      },
      include: {
        invoice_lines: {
          include: {
            items: true,
          },
          orderBy: {
            line_number: 'asc',
          },
        },
        vendors: true,
        purchase_orders: {
          include: {
            po_lines: true,
          },
        },
        goods_receipts: {
          include: {
            grn_lines: true,
          },
        },
        users: true,
        approver: true,
        three_way_matches: true,
        payments: {
          orderBy: {
            payment_date: 'desc',
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Supplier invoice not found');
    }

    return invoice;
  }

  async update(
    companyId: string,
    id: string,
    updateDto: UpdateSupplierInvoiceDto,
  ) {
    const invoice = await this.findOne(companyId, id);

    if (invoice.status === 'approved' || invoice.status === 'paid') {
      throw new BadRequestException(
        'Cannot update approved or paid invoices',
      );
    }

    // Recalculate totals if lines are updated
    let updateData: any = {
      ...updateDto,
      updated_at: new Date(),
    };

    if (updateDto.lines) {
      let subtotal = 0;
      let taxTotal = 0;

      updateDto.lines.forEach((line) => {
        const lineTotal = line.quantity * line.unit_price;
        subtotal += lineTotal;
        taxTotal += line.tax_amount || 0;
      });

      updateData.subtotal = subtotal;
      updateData.tax_total = taxTotal;
      updateData.total = subtotal + taxTotal;

      // Delete existing lines and create new ones
      await this.prisma.supplier_invoice_lines.deleteMany({
        where: { invoice_id: id },
      });

      updateData.invoice_lines = {
        create: updateDto.lines.map((line, index) => ({
          line_number: index + 1,
          po_line_id: line.po_line_id,
          grn_line_id: line.grn_line_id,
          item_id: line.item_id,
          description: line.description,
          quantity: line.quantity,
          unit_price: line.unit_price,
          tax_amount: line.tax_amount || 0,
          total: line.quantity * line.unit_price + (line.tax_amount || 0),
        })),
      };
    }

    return this.prisma.supplier_invoices.update({
      where: { id },
      data: updateData,
      include: {
        invoice_lines: true,
        vendors: true,
        purchase_orders: true,
        goods_receipts: true,
      },
    });
  }

  async approve(companyId: string, id: string, userId: string) {
    const invoice = await this.findOne(companyId, id);

    if (invoice.status !== 'pending') {
      throw new BadRequestException('Only pending invoices can be approved');
    }

    // Check 3-way match if applicable
    if (invoice.po_id && invoice.grn_id) {
      const matchResult = await this.matchingService.getMatchResult(id);

      if (!matchResult || matchResult.match_status !== 'matched') {
        throw new BadRequestException(
          '3-way match failed. Please review discrepancies before approving.',
        );
      }
    }

    return this.prisma.supplier_invoices.update({
      where: { id },
      data: {
        status: 'approved',
        approved_by: userId,
        approved_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        vendors: true,
        invoice_lines: true,
      },
    });
  }

  async reject(companyId: string, id: string, notes?: string) {
    const invoice = await this.findOne(companyId, id);

    if (invoice.status !== 'pending') {
      throw new BadRequestException('Only pending invoices can be rejected');
    }

    return this.prisma.supplier_invoices.update({
      where: { id },
      data: {
        status: 'rejected',
        notes: notes ? `${invoice.notes || ''}\nRejection: ${notes}` : invoice.notes,
        updated_at: new Date(),
      },
    });
  }

  async recordPayment(
    companyId: string,
    id: string,
    userId: string,
    paymentDto: RecordPaymentDto,
  ) {
    const invoice = await this.findOne(companyId, id);

    if (invoice.status !== 'approved' && invoice.payment_status === 'paid') {
      throw new BadRequestException(
        'Only approved invoices can receive payments',
      );
    }

    // Calculate total paid amount
    const existingPayments = await this.prisma.invoice_payments.findMany({
      where: { invoice_id: id },
    });

    const totalPaid =
      existingPayments.reduce((sum, p) => sum + Number(p.amount), 0) +
      paymentDto.amount;

    const invoiceTotal = Number(invoice.total);

    if (totalPaid > invoiceTotal) {
      throw new BadRequestException(
        'Payment amount exceeds invoice total',
      );
    }

    // Determine new payment status
    let newPaymentStatus: 'paid' | 'partially_paid' | 'unpaid';
    if (totalPaid >= invoiceTotal) {
      newPaymentStatus = 'paid';
    } else if (totalPaid > 0) {
      newPaymentStatus = 'partially_paid';
    } else {
      newPaymentStatus = 'unpaid';
    }

    // Create payment record
    await this.prisma.invoice_payments.create({
      data: {
        company_id: companyId,
        invoice_id: id,
        payment_date: new Date(paymentDto.payment_date),
        amount: paymentDto.amount,
        payment_method: paymentDto.payment_method,
        reference_number: paymentDto.reference_number,
        notes: paymentDto.notes,
        created_by: userId,
      },
    });

    // Update invoice payment status
    return this.prisma.supplier_invoices.update({
      where: { id },
      data: {
        payment_status: newPaymentStatus,
        status: newPaymentStatus === 'paid' ? 'paid' : invoice.status,
        updated_at: new Date(),
      },
      include: {
        vendors: true,
        payments: true,
      },
    });
  }

  async delete(companyId: string, id: string) {
    const invoice = await this.findOne(companyId, id);

    if (invoice.status === 'approved' || invoice.status === 'paid') {
      throw new BadRequestException(
        'Cannot delete approved or paid invoices. Consider cancelling instead.',
      );
    }

    return this.prisma.supplier_invoices.update({
      where: { id },
      data: {
        deleted_at: new Date(),
      },
    });
  }

  async cancel(companyId: string, id: string) {
    const invoice = await this.findOne(companyId, id);

    if (invoice.payment_status === 'paid') {
      throw new BadRequestException('Cannot cancel paid invoices');
    }

    return this.prisma.supplier_invoices.update({
      where: { id },
      data: {
        status: 'cancelled',
        payment_status: 'cancelled',
        updated_at: new Date(),
      },
    });
  }

  async performMatching(companyId: string, id: string, userId: string) {
    const invoice = await this.findOne(companyId, id);

    if (!invoice.po_id || !invoice.grn_id) {
      throw new BadRequestException(
        'Invoice must have both PO and GRN references to perform matching',
      );
    }

    const matchResult = await this.matchingService.performMatch(companyId, id);

    await this.matchingService.saveMatchResult(
      companyId,
      id,
      userId,
      matchResult,
    );

    return matchResult;
  }

  async getVendorStatistics(companyId: string, vendorId: string) {
    const totalInvoices = await this.prisma.supplier_invoices.count({
      where: {
        company_id: companyId,
        vendor_id: vendorId,
        deleted_at: null,
      },
    });

    const totalAmount = await this.prisma.supplier_invoices.aggregate({
      where: {
        company_id: companyId,
        vendor_id: vendorId,
        deleted_at: null,
      },
      _sum: {
        total: true,
      },
    });

    const paidAmount = await this.prisma.supplier_invoices.aggregate({
      where: {
        company_id: companyId,
        vendor_id: vendorId,
        payment_status: 'paid',
        deleted_at: null,
      },
      _sum: {
        total: true,
      },
    });

    const pendingInvoices = await this.prisma.supplier_invoices.count({
      where: {
        company_id: companyId,
        vendor_id: vendorId,
        payment_status: { in: ['unpaid', 'partially_paid'] },
        deleted_at: null,
      },
    });

    return {
      total_invoices: totalInvoices,
      total_amount: totalAmount._sum.total || 0,
      paid_amount: paidAmount._sum.total || 0,
      pending_invoices: pendingInvoices,
    };
  }

  private async generateInvoiceNumber(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `SI-${year}-`;

    const lastInvoice = await this.prisma.supplier_invoices.findFirst({
      where: {
        company_id: companyId,
        invoice_number: {
          startsWith: prefix,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    let nextNumber = 1;
    if (lastInvoice) {
      const lastNumber = parseInt(
        lastInvoice.invoice_number.replace(prefix, ''),
      );
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
  }
}
