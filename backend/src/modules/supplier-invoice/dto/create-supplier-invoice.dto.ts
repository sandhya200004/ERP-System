import {
  IsString,
  IsUUID,
  IsOptional,
  IsDateString,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSupplierInvoiceLineDto {
  @ApiPropertyOptional({ description: 'Purchase order line ID' })
  @IsOptional()
  @IsUUID()
  po_line_id?: string;

  @ApiPropertyOptional({ description: 'GRN line ID' })
  @IsOptional()
  @IsUUID()
  grn_line_id?: string;

  @ApiPropertyOptional({ description: 'Item ID' })
  @IsOptional()
  @IsUUID()
  item_id?: string;

  @ApiProperty({ description: 'Line description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Quantity', minimum: 0 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ description: 'Unit price', minimum: 0 })
  @IsNumber()
  @Min(0)
  unit_price: number;

  @ApiPropertyOptional({ description: 'Tax amount', minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax_amount?: number;
}

export class CreateSupplierInvoiceDto {
  @ApiProperty({ description: 'Vendor invoice number' })
  @IsString()
  vendor_invoice_number: string;

  @ApiPropertyOptional({ description: 'Purchase order ID' })
  @IsOptional()
  @IsUUID()
  po_id?: string;

  @ApiPropertyOptional({ description: 'Goods receipt note ID' })
  @IsOptional()
  @IsUUID()
  grn_id?: string;

  @ApiProperty({ description: 'Vendor ID' })
  @IsUUID()
  vendor_id: string;

  @ApiProperty({ description: 'Invoice date (ISO format)' })
  @IsDateString()
  invoice_date: string;

  @ApiProperty({ description: 'Due date (ISO format)' })
  @IsDateString()
  due_date: string;

  @ApiPropertyOptional({ description: 'Currency code', default: 'USD' })
  @IsOptional()
  @IsString()
  currency_code?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Invoice lines', type: [CreateSupplierInvoiceLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSupplierInvoiceLineDto)
  lines: CreateSupplierInvoiceLineDto[];
}
