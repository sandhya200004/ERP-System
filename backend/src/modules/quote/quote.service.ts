import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AuditService } from '../../shared/audit/audit.service';
import { CurrencyService } from '../currency/currency.service';
import { TaxService } from '../tax/tax.service';
import { CreateQuoteDto, UpdateQuoteDto, QueryQuoteDto } from './dto';

@Injectable()
export class QuoteService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private currencyService: CurrencyService,
    private taxService: TaxService,
  ) {}

  async create(company_id: string, user_id: string, createQuoteDto: CreateQuoteDto) {
    const { lines, currencyCode = 'USD', ...quoteData } = createQuoteDto;

    // Get the next quote number
    const lastQuote = await this.prisma.quotes.findFirst({
      where: { company_id },
      orderBy: { quote_number: 'desc' },
    });

    const nextNumber = lastQuote
      ? parseInt(lastQuote.quote_number.replace(/\D/g, '')) + 1
      : 1;
    const quoteNumber = `QUO-${nextNumber.toString().padStart(5, '0')}`;

    // Get FX rate for the quote date
    const quoteDate = new Date(createQuoteDto.quoteDate);
    const fxRate = currencyCode === 'USD' 
      ? 1 
      : (await this.currencyService.getFxRate(currencyCode, quoteDate)).rate;

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

    // Apply quote-level discount
    const discountAmount = subtotal * ((quoteData.discount || 0) / 100);
    const amountAfterDiscount = subtotal - discountAmount;

    // Calculate total tax
    const totalTax = processedLines.reduce((sum, line) => sum + line.tax_amount, 0);
    const total = amountAfterDiscount + totalTax;

    // Create quote with lines
    const quote = await this.prisma.quotes.create({
      data: {
        id: randomUUID(),
        quote_number: quoteNumber,
        company_id,
        customer_id: quoteData.customerId,
        quote_date: new Date(quoteData.quoteDate),
        valid_until: new Date(quoteData.validUntil),
        currency_code: currencyCode,
        fx_rate: fxRate,
        subtotal: Number(subtotal.toFixed(2)),
        discount_amount: Number(discountAmount.toFixed(2)),
        tax_total: Number(totalTax.toFixed(2)),
        total: Number(total.toFixed(2)),
        terms: quoteData.terms,
        notes: quoteData.notes,
        created_by: user_id,
        status: 'draft',
        updated_at: new Date(),
        quote_lines: {
          create: processedLines.map((line, index) => ({
            id: randomUUID(),
            line_number: index + 1,
            item_id: line.itemId || null,
            description: line.description,
            quantity: line.quantity,
            unit_price: line.unitPrice,
            discount_percent: line.discount || 0,
            discount_amount: line.discount_amount,
            subtotal: line.subtotal,
            tax_amount: line.tax_amount,
            total: line.total,
            updated_at: new Date(),
            quote_line_taxes: {
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
        quote_lines: {
          include: {
            items: true,
          },
        },
      },
    });

    await this.audit.log({
      companyId: company_id,
      userId: user_id,
      action: 'create' as any,
      entity_type: 'quote',
      entityId: quote.id,
      newValues: quote,
    });

    return quote;
  }

  async findAll(company_id: string, query: QueryQuoteDto) {
    const { search, status, customerId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { company_id };

    if (search) {
      where.OR = [
        { quote_number: { contains: search, mode: 'insensitive' } },
        { customers: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    const [quotes, total] = await Promise.all([
      this.prisma.quotes.findMany({
        where,
        skip,
        take: limit,
        orderBy: { quote_date: 'desc' },
        include: {
          customers: true,
          quote_lines: {
            include: {
              items: true,
            },
          },
        },
      }),
      this.prisma.quotes.count({ where }),
    ]);

    return {
      data: quotes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, company_id: string) {
    const quote = await this.prisma.quotes.findUnique({
      where: { id },
      include: {
        customers: true,
        quote_lines: {
          include: {
            items: true,
          },
          orderBy: { line_number: 'asc' },
        },
      },
    });

    if (!quote) {
      throw new NotFoundException(`Quote with ID ${id} not found`);
    }

    if (quote.company_id !== company_id) {
      throw new ForbiddenException('Access denied to this quote');
    }

    return quote;
  }

  async update(
    id: string,
    company_id: string,
    user_id: string,
    updateQuoteDto: UpdateQuoteDto,
  ) {
    const existingQuote = await this.findOne(id, company_id);

    // Only allow updates for draft quotes
    if (existingQuote.status !== 'draft') {
      throw new BadRequestException('Only draft quotes can be updated');
    }

    // If lines are being updated, delete old ones and recalculate
    if (updateQuoteDto.lines) {
      await this.prisma.quote_lines.deleteMany({ where: { quote_id: id } });
      
      // Recreate the quote with new lines
      const { lines, ...quoteData } = updateQuoteDto;
      
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

      const discountAmount = Number(existingQuote.discount_amount || 0);
      const amountAfterDiscount = subtotal - discountAmount;
      const totalTax = processedLines.reduce((sum, line) => sum + line.tax_amount, 0);
      const total = amountAfterDiscount + totalTax;

      const quote = await this.prisma.quotes.update({
        where: { id },
        data: {
          ...quoteData,
          subtotal: Number(subtotal.toFixed(2)),
          discount_amount: Number(discountAmount.toFixed(2)),
          tax_total: Number(totalTax.toFixed(2)),
          total: Number(total.toFixed(2)),
          quote_lines: {
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
              quote_line_taxes: {
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
          quote_lines: {
            include: {
              items: true,
            },
          },
        },
      });

      await this.audit.log({
      companyId: company_id,
        userId: user_id,
        action: 'update' as any,
        entity_type: 'quote',
        entityId: quote.id,
        oldValues: existingQuote,
        newValues: quote,
      });

      return quote;
    }

    // Simple update without line changes
    const quote = await this.prisma.quotes.update({
      where: { id },
      data: updateQuoteDto as any,
      include: {
        customers: true,
        quote_lines: {
          include: {
            items: true,
          },
        },
      },
    });

    await this.audit.log({
      companyId: company_id,
      userId: user_id,
      action: 'update' as any,
      entity_type: 'quote',
      entityId: quote.id,
      oldValues: existingQuote,
      newValues: quote,
    });

    return quote;
  }

  async updateStatus(
    id: string,
    company_id: string,
    user_id: string,
    status: 'sent' | 'accepted' | 'rejected' | 'expired',
  ) {
    const quote = await this.findOne(id, company_id);

    const updatedQuote = await this.prisma.quotes.update({
      where: { id },
      data: { status },
      include: {
        customers: true,
        quote_lines: {
          include: {
            items: true,
          },
        },
      },
    });

    await this.audit.log({
      companyId: company_id,
      userId: user_id,
      action: 'update' as any,
      entity_type: 'quote',
      entityId: quote.id,
      oldValues: { status: quote.status },
      newValues: { status },
    });

    return updatedQuote;
  }

  async remove(id: string, company_id: string, user_id: string) {
    const quote = await this.findOne(id, company_id);

    // Only allow deletion of draft quotes
    if (quote.status !== 'draft') {
      throw new BadRequestException('Only draft quotes can be deleted');
    }

    // Soft delete
    await this.prisma.quotes.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    await this.audit.log({
      companyId: company_id,
      userId: user_id,
      action: 'delete' as any,
      entity_type: 'quote',
      entityId: quote.id,
      oldValues: quote,
    });

    return { message: 'Quote deleted successfully' };
  }
}

