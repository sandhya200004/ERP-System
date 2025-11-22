import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AuditService } from '../../shared/audit/audit.service';
import { CurrencyService } from '../currency/currency.service';
import { CreatePaymentDto, QueryPaymentDto } from './dto';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private currencyService: CurrencyService,
  ) {}

  async create(company_id: string, user_id: string, createPaymentDto: CreatePaymentDto) {
    const { applications, currencyCode = 'USD', ...paymentData } = createPaymentDto;

    // Validate total application amount doesn't exceed payment amount
    const totalApplications = applications.reduce((sum, app) => sum + app.amount, 0);
    if (totalApplications > paymentData.amount) {
      throw new BadRequestException('Total application amount cannot exceed payment amount');
    }

    // Get the next payment number
    const lastPayment = await this.prisma.payments.findFirst({
      where: { company_id },
      orderBy: { payment_number: 'desc' },
    });

    const nextNumber = lastPayment
      ? parseInt(lastPayment.payment_number.replace(/\D/g, '')) + 1
      : 1;
    const paymentNumber = `PAY-${nextNumber.toString().padStart(5, '0')}`;

    // Get FX rate for the payment date
    const paymentDate = new Date(createPaymentDto.paymentDate);
    const fxRate = currencyCode === 'USD' 
      ? 1 
      : (await this.currencyService.getFxRate(currencyCode, paymentDate)).rate;

    // Validate all invoices exist and belong to this customer
    const invoices = await this.prisma.invoices.findMany({
      where: {
        id: { in: applications.map(app => app.invoiceId) },
        company_id,
      },
    });

    if (invoices.length !== applications.length) {
      throw new NotFoundException('One or more invoices not found');
    }

    const customerIds = [...new Set(invoices.map((inv: any) => inv.customer_id))];
    if (customerIds.length > 1 || customerIds[0] !== paymentData.customerId) {
      throw new BadRequestException('All invoices must belong to the payment customer');
    }

    // Create payment with applications using transaction
    const result = await this.prisma.$transaction(async (tx: any) => {
      // Create payment
      const payment = await tx.payments.create({
        data: {
          payment_number: paymentNumber,
          company_id,
          customer_id: paymentData.customerId,
          payment_date: new Date(paymentData.paymentDate),
          amount: paymentData.amount,
          currency_code: currencyCode,
          fx_rate: fxRate,
          payment_method: paymentData.paymentMethod,
          reference: paymentData.reference,
          notes: paymentData.notes,
        },
      });

      // Apply to invoices
      for (const app of applications) {
        const invoice = invoices.find((inv: any) => inv.id === app.invoiceId);
        
        // Check if application amount is valid
        if (app.amount > Number(invoice!.amount_due)) {
          throw new BadRequestException(
            `Application amount ${app.amount} exceeds invoice ${invoice!.invoice_number} amount due ${invoice!.amount_due}`
          );
        }

        // Calculate FX gain/loss if currencies differ
        let fxGainLoss = 0;
        if (invoice!.currency_code !== currencyCode) {
          fxGainLoss = await this.currencyService.calculateFxGainLoss(
            app.amount,
            invoice!.currency_code,
            app.amount,
            currencyCode,
            invoice!.invoice_date,
            paymentDate,
          );
        }

        // Create payment application
        await tx.payment_applications.create({
          data: {
            payment_id: payment.id,
            invoice_id: app.invoiceId,
            amount: app.amount,
            fx_gain_loss: fxGainLoss,
          },
        });

        // Update invoice amounts
        const newAmountPaid = Number(invoice!.amount_paid) + app.amount;
        const newAmountDue = Number(invoice!.total) - newAmountPaid;
        
        let newStatus = invoice!.status;
        if (newAmountDue <= 0) {
          newStatus = 'paid';
        } else if (newAmountPaid > 0) {
          newStatus = 'partially_paid';
        }

        await tx.invoices.update({
          where: { id: app.invoiceId },
          data: {
            amount_paid: newAmountPaid,
            amount_due: newAmountDue,
            status: newStatus,
          },
        });
      }

      return payment;
    });

    // Fetch complete payment with relations
    const payment = await this.prisma.payments.findUnique({
      where: { id: result.id },
      include: {
        customers: true,
        payment_applications: {
          include: {
            invoices: true,
          },
        },
      },
    });

    await this.audit.log({
      companyId: company_id,
      userId: user_id,
      action: 'create' as any,
      entity_type: 'payment',
      entityId: payment!.id,
      newValues: payment,
    });

    return payment;
  }

  async findAll(company_id: string, query: QueryPaymentDto) {
    const { search, customerId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { company_id };

    if (search) {
      where.OR = [
        { payment_number: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (customerId) {
      where.customer_id = customerId;
    }

    const [payments, total] = await Promise.all([
      this.prisma.payments.findMany({
        where,
        skip,
        take: limit,
        orderBy: { payment_date: 'desc' },
        include: {
          customers: true,
          payment_applications: {
            include: {
              invoices: true,
            },
          },
        },
      }),
      this.prisma.payments.count({ where }),
    ]);

    return {
      data: payments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, company_id: string) {
    const payment = await this.prisma.payments.findUnique({
      where: { id },
      include: {
        customers: true,
        payment_applications: {
          include: {
            invoices: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    if (payment.company_id !== company_id) {
      throw new ForbiddenException('Access denied to this payment');
    }

    return payment;
  }

  async remove(id: string, company_id: string, user_id: string) {
    const payment = await this.findOne(id, company_id);

    // Reverse all payment applications
    await this.prisma.$transaction(async (tx: any) => {
      for (const app of payment.payment_applications) {
        const invoice = await tx.invoices.findUnique({ where: { id: app.invoice_id } });
        const amountPaidNum = Number(invoice.amount_paid);
        const amountDueNum = Number(invoice.amount_due);
        const appAmount = Number(app.amount);
        
        await tx.invoices.update({
          where: { id: app.invoice_id },
          data: {
            amount_paid: amountPaidNum - appAmount,
            amount_due: amountDueNum + appAmount,
            status: amountPaidNum - appAmount <= 0 
              ? 'sent' 
              : 'partially_paid',
          },
        });
      }

      // Delete applications
      await tx.payment_applications.deleteMany({ where: { payment_id: id } });

      // Soft delete payment
      await tx.payments.update({
        where: { id },
        data: { deleted_at: new Date() },
      });
    });

    await this.audit.log({
      companyId: company_id,
      userId: user_id,
      action: 'delete' as any,
      entity_type: 'payment',
      entityId: payment.id,
      oldValues: payment,
    });

    return { message: 'Payment deleted successfully' };
  }

  async getStats(company_id: string) {
    const total = await this.prisma.payments.count({ where: { company_id } });

    const totalAmount = await this.prisma.payments.aggregate({
      where: { company_id },
      _sum: { amount: true },
    });

    const byMethod = await this.prisma.payments.groupBy({
      by: ['payment_method'],
      where: { company_id },
      _count: true,
      _sum: { amount: true },
    });

    return {
      total,
      totalAmount: (totalAmount._sum?.amount || 0) || 0,
      byMethod,
    };
  }
}

