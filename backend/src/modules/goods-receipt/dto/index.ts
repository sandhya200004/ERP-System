import { IsString, IsOptional, IsUUID, IsDateString, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGRNLineDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  item_id?: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  ordered_qty?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  received_qty: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  warehouse_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateGoodsReceiptDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  po_id?: string;

  @ApiProperty()
  @IsUUID()
  vendor_id: string;

  @ApiProperty()
  @IsDateString()
  receipt_date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateGRNLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGRNLineDto)
  lines: CreateGRNLineDto[];
}

export class UpdateGoodsReceiptDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  receipt_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [CreateGRNLineDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGRNLineDto)
  lines?: CreateGRNLineDto[];
}

export class GRNFilterDto {
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
  @IsUUID()
  po_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
