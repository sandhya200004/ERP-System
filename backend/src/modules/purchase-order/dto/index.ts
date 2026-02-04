import {
  IsString,
  IsUUID,
  IsDateString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class POLineDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  item_id?: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unit_price: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  tax_amount?: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty()
  @IsUUID()
  vendor_id: string;

  @ApiProperty()
  @IsDateString()
  order_date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expected_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  terms?: string;

  @ApiProperty({ type: [POLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => POLineDto)
  lines: POLineDto[];
}

export class UpdatePurchaseOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expected_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  terms?: string;

  @ApiPropertyOptional({ type: [POLineDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => POLineDto)
  lines?: POLineDto[];
}

export class POFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vendor_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
