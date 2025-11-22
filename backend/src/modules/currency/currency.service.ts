import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateFxRateDto } from './dto';

@Injectable()
export class CurrencyService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all available currencies
   */
  async findAllCurrencies() {
    return this.prisma.currencies.findMany({
      orderBy: { code: 'asc' },
    });
  }

  /**
   * Get a specific currency by code
   */
  async findCurrencyByCode(code: string) {
    const currency = await this.prisma.currencies.findUnique({
      where: { code },
    });

    if (!currency) {
      throw new NotFoundException(`Currency ${code} not found`);
    }

    return currency;
  }

  /**
   * Create or update FX rate for a specific date
   */
  async upsertFxRate(createFxRateDto: CreateFxRateDto) {
    const { currencyCode, rate, date } = createFxRateDto;

    // Verify currency exists
    await this.findCurrencyByCode(currencyCode);

    const rateDate = new Date(date);
    rateDate.setUTCHours(0, 0, 0, 0);

    return this.prisma.fx_rates.upsert({
      where: {
        from_currency_to_currency_effective_date: {
          from_currency: currencyCode,
          to_currency: 'USD',
          effective_date: rateDate,
        },
      },
      update: { rate },
      create: {
        id: randomUUID(),
        from_currency: currencyCode,
        to_currency: 'USD',
        rate,
        effective_date: rateDate,
      },
    });
  }

  /**
   * Get FX rate for a specific currency and date
   * If no rate exists for that date, returns the most recent rate before that date
   */
  async getFxRate(currency_code: string, date: Date) {
    const rateDate = new Date(date);
    rateDate.setUTCHours(0, 0, 0, 0);

    const fxRate = await this.prisma.fx_rates.findFirst({
      where: {
        from_currency: currency_code,
        to_currency: 'USD',
        effective_date: { lte: rateDate },
      },
      orderBy: { effective_date: 'desc' },
    });

    if (!fxRate) {
      throw new NotFoundException(
        `No FX rate found for ${currency_code} on or before ${date.toISOString().split('T')[0]}`,
      );
    }

    return fxRate;
  }

  /**
   * Get all FX rates for a specific currency
   */
  async getFxRateHistory(currency_code: string, limit: number = 30) {
    await this.findCurrencyByCode(currency_code);

    return this.prisma.fx_rates.findMany({
      where: { 
        from_currency: currency_code,
        to_currency: 'USD',
      },
      orderBy: { effective_date: 'desc' },
      take: limit,
    });
  }

  /**
   * Convert amount from one currency to another using rates from a specific date
   */
  async convertCurrency(
    amount: number,
    from_currency: string,
    to_currency: string,
    date: Date,
  ): Promise<{ convertedAmount: number; fromRate: number; toRate: number; fxGainLoss?: number }> {
    // If same currency, no conversion needed
    if (from_currency === to_currency) {
      return {
        convertedAmount: amount,
        fromRate: 1,
        toRate: 1,
      };
    }

    // Get rates for both currencies
    const [fromRate, toRate] = await Promise.all([
      from_currency === 'USD' 
        ? Promise.resolve({ rate: 1 as any }) 
        : this.getFxRate(from_currency, date),
      to_currency === 'USD' 
        ? Promise.resolve({ rate: 1 as any }) 
        : this.getFxRate(to_currency, date),
    ]);

    // Convert to USD first, then to target currency
    const usdAmount = amount / Number(fromRate.rate);
    const convertedAmount = usdAmount * Number(toRate.rate);

    return {
      convertedAmount: Number(convertedAmount.toFixed(2)),
      fromRate: Number(fromRate.rate),
      toRate: Number(toRate.rate),
    };
  }

  /**
   * Calculate FX gain/loss between two amounts in different currencies
   */
  async calculateFxGainLoss(
    originalAmount: number,
    originalCurrency: string,
    paidAmount: number,
    paidCurrency: string,
    originalDate: Date,
    paymentDate: Date,
  ): Promise<number> {
    // Convert original amount to payment currency using original date rate
    const originalConverted = await this.convertCurrency(
      originalAmount,
      originalCurrency,
      paidCurrency,
      originalDate,
    );

    // Convert original amount to payment currency using payment date rate
    const paymentConverted = await this.convertCurrency(
      originalAmount,
      originalCurrency,
      paidCurrency,
      paymentDate,
    );

    // FX gain/loss is the difference
    const fxGainLoss = paymentConverted.convertedAmount - originalConverted.convertedAmount;

    return Number(fxGainLoss.toFixed(2));
  }
}
