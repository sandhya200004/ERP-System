import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, Min, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class InvoiceLineDto {
  @ApiPropertyOptional({ description: 'Item ID (optional if custom description)' })
  @IsOptional()
  @IsString()
  itemId?: string;

  @ApiProperty({ description: 'Line description' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'Quantity' })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ description: 'Unit price' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitPrice: number;

  @ApiPropertyOptional({ description: 'Discount percentage', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discount?: number;

  @ApiPropertyOptional({ description: 'Array of tax IDs for this line' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  taxIds?: string[];
}

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @ApiProperty({ description: 'Invoice date (YYYY-MM-DD)' })
  @IsDateString()
  invoiceDate: string;

  @ApiProperty({ description: 'Due date (YYYY-MM-DD)' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ description: 'Quote ID if converted from quote' })
  @IsOptional()
  @IsString()
  quoteId?: string;

  @ApiPropertyOptional({ description: 'Currency code', default: 'USD' })
  @IsOptional()
  @IsString()
  currencyCode?: string;

  @ApiPropertyOptional({ description: 'Invoice-level discount percentage', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discount?: number;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  @IsOptional()
  @IsString()
  terms?: string;

  @ApiPropertyOptional({ description: 'Internal notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Invoice line items', type: [InvoiceLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  lines: InvoiceLineDto[];
}
