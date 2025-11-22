import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { AuditModule } from '../../shared/audit/audit.module';
import { CurrencyModule } from '../currency/currency.module';

@Module({
  imports: [PrismaModule, AuditModule, CurrencyModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
