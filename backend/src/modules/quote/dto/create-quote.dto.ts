import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, Min, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class QuoteLineDto {
  @ApiPropertyOptional({ description: 'Item ID (optional for custom line items)' })
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

export class CreateQuoteDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @ApiProperty({ description: 'Quote date (YYYY-MM-DD)' })
  @IsDateString()
  quoteDate: string;

  @ApiProperty({ description: 'Valid until date (YYYY-MM-DD)' })
  @IsDateString()
  validUntil: string;

  @ApiPropertyOptional({ description: 'Currency code', default: 'USD' })
  @IsOptional()
  @IsString()
  currencyCode?: string;

  @ApiPropertyOptional({ description: 'Quote-level discount percentage', default: 0 })
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

  @ApiProperty({ description: 'Quote line items', type: [QuoteLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteLineDto)
  lines: QuoteLineDto[];
}
