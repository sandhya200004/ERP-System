import { Module } from '@nestjs/common';
import { SupplierInvoiceService } from './supplier-invoice.service';
import { SupplierInvoiceController } from './supplier-invoice.controller';
import { ThreeWayMatchingService } from './three-way-matching.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SupplierInvoiceController],
  providers: [SupplierInvoiceService, ThreeWayMatchingService],
  exports: [SupplierInvoiceService, ThreeWayMatchingService],
})
export class SupplierInvoiceModule {}
