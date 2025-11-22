import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AuditService } from '../../shared/audit/audit.service';
import { CurrencyService } from '../currency/currency.service';
import { TaxService } from '../tax/tax.service';
import { CreateInvoiceDto, UpdateInvoiceDto, QueryInvoiceDto } from './dto';

@Injectable()
export class InvoiceService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private currencyService: CurrencyService,
    private taxService: TaxService,
  ) {}

  async create(company_id: string, user_id: string, createInvoiceDto: CreateInvoiceDto) {
    const { lines, currencyCode = 'USD', ...invoiceData } = createInvoiceDto;

    // Get the next invoice number
    const lastInvoice = await this.prisma.invoices.findFirst({
      where: { company_id },
      orderBy: { invoice_number: 'desc' },
    });

    const nextNumber = lastInvoice
      ? parseInt(lastInvoice.invoice_number.replace(/\D/g, '')) + 1
      : 1;
    const invoiceNumber = `INV-${nextNumber.toString().padStart(5, '0')}`;

    // Get FX rate for the invoice date
    const invoiceDate = new Date(createInvoiceDto.invoiceDate);
    const fxRate = currencyCode === 'USD' 
      ? 1 
      : (await this.currencyService.getFxRate(currencyCode, invoiceDate)).rate;

    // Calculate totals
    let subtotal = 0;
    const processedLines = [];

    for (const line of lines) {
      const lineSubtotal = line.quantity * line.unitPrice;
      const lineDiscount = lineSubtotal * ((line.discount || 0) / 100);
      const lineAmount = lineSubtotal - lineDiscount;

      // Calculate taxes for this line
      const lineTaxes = line.taxIds?.length
        ? await this.taxService.calculateMultipleTaxes(company_id, lineAmount, line.taxIds)
        : [];

      const lineTaxTotal = lineTaxes.reduce((sum, tax) => sum + tax.amount, 0);

      processedLines.push({
        ...line,
        description: line.description || '',
        subtotal: Number(lineSubtotal.toFixed(2)),
        discount_amount: Number(lineDiscount.toFixed(2)),
        amount: Number(lineAmount.toFixed(2)),
        tax_amount: Number(lineTaxTotal.toFixed(2)),
        total: Number((lineAmount + lineTaxTotal).toFixed(2)),
        taxes: lineTaxes,
      });

      subtotal += lineAmount;
    }

    // Apply invoice-level discount
    const discountAmount = subtotal * ((invoiceData.discount || 0) / 100);
    const amountAfterDiscount = subtotal - discountAmount;

    // Calculate total tax
    const totalTax = processedLines.reduce((sum, line) => sum + line.tax_amount, 0);
    const total = amountAfterDiscount + totalTax;

    // Create invoice with lines
    const invoice = await this.prisma.invoices.create({
      data: {
        id: randomUUID(),
        invoice_number: invoiceNumber,
        company_id,
        customer_id: invoiceData.customerId,
        quote_id: invoiceData.quoteId,
        invoice_date: new Date(invoiceData.invoiceDate),
        due_date: new Date(invoiceData.dueDate),
        currency_code: currencyCode,
        fx_rate: fxRate,
        subtotal: Number(subtotal.toFixed(2)),
        discount_amount: Number(discountAmount.toFixed(2)),
        tax_total: Number(totalTax.toFixed(2)),
        total: Number(total.toFixed(2)),
        amount_paid: 0,
        amount_due: Number(total.toFixed(2)),
        terms: invoiceData.terms,
        notes: invoiceData.notes,
        status: 'draft',
        created_by: user_id,
        updated_at: new Date(),
        invoice_lines: {
          create: processedLines.map((line, index) => ({
            id: randomUUID(),
            line_number: index + 1,
            item_id: line.itemId,
            description: line.description,
            quantity: line.quantity,
            unit_price: line.unitPrice,
            discount_percent: line.discount || 0,
            discount_amount: line.discount_amount,
            subtotal: line.subtotal,
            tax_amount: line.tax_amount,
            total: line.total,
            updated_at: new Date(),
            invoice_line_taxes: {
              create: line.taxes.map(tax => ({
                id: randomUUID(),
                tax_id: tax.tax_id,
                tax_rate: tax.rate,
                tax_amount: tax.amount,
              })),
            },
          })),
        },
      },
      include: {
        customers: true,
        invoice_lines: {
          include: { items: true,
            invoice_line_taxes: {
              include: { taxes: true },
            },
          },
        },
      },
    });

    await this.audit.log({
      companyId: company_id,
      userId: user_id,
      action: 'create' as any,
      entity_type: 'invoice',
      entityId: invoice.id,
      newValues: invoice,
    });

    return invoice;
  }

  async findAll(company_id: string, query: QueryInvoiceDto) {
    const { search, status, customerId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { company_id };

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customers: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customer_id = customerId;
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoices.findMany({
        where,
        skip,
        take: limit,
        orderBy: { invoice_date: 'desc' },
        include: {
          customers: true,
          invoice_lines: {
            include: { items: true,
            },
          },
        },
      }),
      this.prisma.invoices.count({ where }),
    ]);

    return {
      data: invoices,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, company_id: string) {
    const invoice = await this.prisma.invoices.findUnique({
      where: { id },
      include: {
        customers: true,
        invoice_lines: {
          include: { items: true,
            invoice_line_taxes: {
              include: { taxes: true },
            },
          },
          orderBy: { line_number: 'asc' },
        },
        payment_applications: {
          include: {
            payments: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    if (invoice.company_id !== company_id) {
      throw new ForbiddenException('Access denied to this invoice');
    }

    return invoice;
  }

  async update(
    id: string,
    company_id: string,
    user_id: string,
    updateInvoiceDto: UpdateInvoiceDto,
  ) {
    const existingInvoice = await this.findOne(id, company_id);

    // Only allow updates for draft invoices
    if (existingInvoice.status !== 'draft') {
      throw new BadRequestException('Only draft invoices can be updated');
    }

    // If lines are being updated, delete old ones and recalculate
    if (updateInvoiceDto.lines) {
      await this.prisma.invoice_lines.deleteMany({ where: { invoice_id: id } });
      
      const { lines, ...invoiceData } = updateInvoiceDto;
      
      // Recalculate everything
      let subtotal = 0;
      const processedLines = [];

      for (const line of lines) {
        const lineSubtotal = line.quantity * line.unitPrice;
        const lineDiscount = lineSubtotal * ((line.discount || 0) / 100);
        const lineAmount = lineSubtotal - lineDiscount;

        const lineTaxes = line.taxIds?.length
          ? await this.taxService.calculateMultipleTaxes(company_id, lineAmount, line.taxIds)
          : [];

        const lineTaxTotal = lineTaxes.reduce((sum, tax) => sum + tax.amount, 0);

        processedLines.push({
          ...line,
          subtotal: Number(lineSubtotal.toFixed(2)),
          discount_amount: Number(lineDiscount.toFixed(2)),
          amount: Number(lineAmount.toFixed(2)),
          tax_amount: Number(lineTaxTotal.toFixed(2)),
          total: Number((lineAmount + lineTaxTotal).toFixed(2)),
          taxes: lineTaxes,
        });

        subtotal += lineAmount;
      }

      const discountAmount = Number(existingInvoice.discount_amount || 0);
      const amountAfterDiscount = subtotal - discountAmount;
      const totalTax = processedLines.reduce((sum, line) => sum + line.tax_amount, 0);
      const total = amountAfterDiscount + totalTax;

      const invoice = await this.prisma.invoices.update({
        where: { id },
        data: {
          ...invoiceData,
          subtotal: Number(subtotal.toFixed(2)),
          discount_amount: Number(discountAmount.toFixed(2)),
          tax_total: Number(totalTax.toFixed(2)),
          total: Number(total.toFixed(2)),
          amount_due: Number(total.toFixed(2)),
          invoice_lines: {
            create: processedLines.map((line, index) => ({
              id: randomUUID(),
              line_number: index + 1,
              item_id: line.itemId,
              description: line.description || '',
              quantity: line.quantity,
              unit_price: line.unitPrice,
              discount_percent: line.discount || 0,
              discount_amount: line.discount_amount,
              subtotal: line.subtotal,
              tax_amount: line.tax_amount,
              total: line.total,
              updated_at: new Date(),
              invoice_line_taxes: {
                create: line.taxes.map(tax => ({
                  id: randomUUID(),
                  tax_id: tax.tax_id,
                  tax_rate: tax.rate,
                  tax_amount: tax.amount,
                })),
              },
            })),
          },
        },
        include: {
          customers: true,
          invoice_lines: {
            include: { 
              items: true,
              invoice_line_taxes: {
                include: { taxes: true },
              },
            },
          },
        },
      });

      await this.audit.log({
        companyId: company_id,
        userId: user_id,
        action: 'finalize' as any,
        entity_type: 'invoice',
        entityId: invoice.id,
        oldValues: existingInvoice,
        newValues: invoice,
      });

      return invoice;
    }

    // Simple update without line changes
    const invoice = await this.prisma.invoices.update({
      where: { id },
      data: updateInvoiceDto as any,
      include: {
        customers: true,
        invoice_lines: {
          include: { items: true,
            invoice_line_taxes: {
              include: { taxes: true },
            },
          },
        },
      },
    });

    await this.audit.log({
      companyId: company_id,
      userId: user_id,
      action: 'update' as any,
      entity_type: 'invoice',
      entityId: invoice.id,
      oldValues: existingInvoice,
      newValues: invoice,
    });

    return invoice;
  }

  /**
   * Finalize invoice - makes it immutable and posts to GL
   */
  async finalize(id: string, company_id: string, user_id: string) {
    const invoice = await this.findOne(id, company_id);

    if (invoice.status !== 'draft') {
      throw new BadRequestException('Only draft invoices can be finalized');
    }

    // TODO: Create journal entry for invoice (AR debit, Revenue credit, Tax credit)
    // This will be implemented when we build the Accounting module

    const finalizedInvoice = await this.prisma.invoices.update({
      where: { id },
      data: { 
        status: 'final',
        finalized_at: new Date(),
      },
      include: {
        customers: true,
        invoice_lines: {
          include: { items: true,
            invoice_line_taxes: {
              include: { taxes: true },
            },
          },
        },
      },
    });

    await this.audit.log({
      companyId: company_id,
      userId: user_id,
      action: 'status_change' as any,
      entity_type: 'invoice',
      entityId: invoice.id,
      oldValues: { status: invoice.status },
      newValues: { status: 'final', finalized_at: new Date() },
    });

    return finalizedInvoice;
  }

  async updateStatus(
    id: string,
    company_id: string,
    user_id: string,
    status: 'sent' | 'cancelled',
  ) {
    const invoice = await this.findOne(id, company_id);

    if (status === 'cancelled' && Number(invoice.amount_paid) > 0) {
      throw new BadRequestException('Cannot cancel an invoice with payments');
    }

    const updatedInvoice = await this.prisma.invoices.update({
      where: { id },
      data: { status },
      include: {
        customers: true,
        invoice_lines: {
          include: { items: true,
          },
        },
      },
    });

    await this.audit.log({
      companyId: company_id,
      userId: user_id,
      action: 'status_change' as any,
      entity_type: 'invoice',
      entityId: invoice.id,
      oldValues: { status: invoice.status },
      newValues: { status: 'voided' },
    });

    return updatedInvoice;
  }

  async remove(id: string, company_id: string, user_id: string) {
    const invoice = await this.findOne(id, company_id);

    // Only allow deletion of draft invoices
    if (invoice.status !== 'draft') {
      throw new BadRequestException('Only draft invoices can be deleted');
    }

    // Soft delete
    await this.prisma.invoices.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    await this.audit.log({
      companyId: company_id,
      userId: user_id,
      action: 'delete' as any,
      entity_type: 'invoice',
      entityId: invoice.id,
      oldValues: invoice,
    });

    return { message: 'Invoice deleted successfully' };
  }

  /**
   * Convert quote to invoice
   */
  async createFromQuote(quoteId: string, company_id: string, user_id: string) {
    const quote = await this.prisma.quotes.findUnique({
      where: { id: quoteId },
      include: {
        quote_lines: {
          include: {
            quote_line_taxes: true,
          },
        },
      },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (quote.company_id !== company_id) {
      throw new ForbiddenException('Access denied to this quote');
    }

    if (quote.status !== 'accepted') {
      throw new BadRequestException('Only accepted quotes can be converted to invoices');
    }

    // Create invoice from quote
    const invoiceDto: CreateInvoiceDto = {
      customerId: quote.customer_id,
      quoteId: quote.id,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      currencyCode: quote.currency_code,
      terms: quote.terms || undefined,
      notes: quote.notes || undefined,
      lines: quote.quote_lines.map((line: any) => ({
        itemId: line.item_id,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unit_price,
        discount: line.discount_percent,
        taxIds: line.quote_line_taxes.map((t: any) => t.tax_id),
      })),
    };

    const invoice = await this.create(company_id, user_id, invoiceDto);

    // Update quote status to converted
    await this.prisma.quotes.update({
      where: { id: quoteId },
      data: { status: 'accepted' }, // Keep as accepted but link to invoice
    });

    return invoice;
  }

  async getStats(company_id: string) {
    const [total, draft, sent, paid, overdue] = await Promise.all([
      this.prisma.invoices.count({ where: { company_id } }),
      this.prisma.invoices.count({ where: { company_id, status: 'draft' } }),
      this.prisma.invoices.count({ where: { company_id, status: 'sent' } }),
      this.prisma.invoices.count({ where: { company_id, status: 'paid' } }),
      this.prisma.invoices.count({ where: { company_id, status: 'overdue' } }),
    ]);

    const totalRevenue = await this.prisma.invoices.aggregate({
      where: { company_id, status: { in: ['paid', 'partially_paid'] } },
      _sum: { amount_paid: true },
    });

    const outstandingAmount = await this.prisma.invoices.aggregate({
      where: { company_id, status: { notIn: ['cancelled', 'paid'] } },
      _sum: { amount_due: true },
    });

    return {
      total,
      draft,
      sent,
      paid,
      overdue,
      totalRevenue: totalRevenue._sum.amount_paid || 0,
      outstanding: outstandingAmount._sum.amount_due || 0,
    };
  }
}

