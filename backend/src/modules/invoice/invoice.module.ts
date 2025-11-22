import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { AuditModule } from '../../shared/audit/audit.module';
import { CurrencyModule } from '../currency/currency.module';
import { TaxModule } from '../tax/tax.module';

@Module({
  imports: [PrismaModule, AuditModule, CurrencyModule, TaxModule],
  controllers: [InvoiceController],
  providers: [InvoiceService],
  exports: [InvoiceService],
})
export class InvoiceModule {}
