import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateSupplierInvoiceDto } from './create-supplier-invoice.dto';

export class UpdateSupplierInvoiceDto extends PartialType(
  OmitType(CreateSupplierInvoiceDto, ['vendor_id'] as const),
) {}
