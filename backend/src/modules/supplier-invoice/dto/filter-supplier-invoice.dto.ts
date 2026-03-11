import { IsOptional, IsUUID, IsEnum, IsDateString, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum InvoiceStatusFilter {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  CANCELLED = 'cancelled',
  DRAFT = 'draft',
  FINAL = 'final',
}

export enum PaymentStatusFilter {
  PENDING = 'pending',
  UNPAID = 'unpaid',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  OVERDUE = 'overdue',
  COMPLETED = 'completed',
}

export class InvoiceFilterDto {
  @ApiPropertyOptional({ description: 'Vendor ID' })
  @IsOptional()
  @IsUUID()
  vendor_id?: string;

  @ApiPropertyOptional({ description: 'Purchase order ID' })
  @IsOptional()
  @IsUUID()
  po_id?: string;

  @ApiPropertyOptional({ description: 'GRN ID' })
  @IsOptional()
  @IsUUID()
  grn_id?: string;

  @ApiPropertyOptional({ enum: InvoiceStatusFilter, description: 'Invoice status' })
  @IsOptional()
  @IsEnum(InvoiceStatusFilter)
  status?: InvoiceStatusFilter;

  @ApiPropertyOptional({ enum: PaymentStatusFilter, description: 'Payment status' })
  @IsOptional()
  @IsEnum(PaymentStatusFilter)
  payment_status?: PaymentStatusFilter;

  @ApiPropertyOptional({ description: 'Start date (ISO format)' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Search query (invoice number, vendor invoice number)' })
  @IsOptional()
  @IsString()
  search?: string;
}
