import { Module } from '@nestjs/common';
import { QuoteService } from './quote.service';
import { QuoteController } from './quote.controller';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { AuditModule } from '../../shared/audit/audit.module';
import { CurrencyModule } from '../currency/currency.module';
import { TaxModule } from '../tax/tax.module';

@Module({
  imports: [PrismaModule, AuditModule, CurrencyModule, TaxModule],
  controllers: [QuoteController],
  providers: [QuoteService],
  exports: [QuoteService],
})
export class QuoteModule {}
