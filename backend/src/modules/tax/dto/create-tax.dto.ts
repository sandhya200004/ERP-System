import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional, IsNumber, Min, Max, MaxLength, IsBoolean, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTaxDto {
  @ApiProperty({ description: 'Tax name (e.g., GST, VAT, Sales Tax)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Tax type', enum: ['gst', 'vat', 'sales_tax', 'other'] })
  @IsIn(['gst', 'vat', 'sales_tax', 'other'])
  type: 'gst' | 'vat' | 'sales_tax' | 'other';

  @ApiProperty({ description: 'Tax rate as percentage (e.g., 18 for 18%)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  rate: number;

  @ApiPropertyOptional({ description: 'Tax description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Tax jurisdiction (e.g., country, state)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  jurisdiction?: string;

  @ApiPropertyOptional({ description: 'Is tax active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
