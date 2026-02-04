import {
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStockMovementDto {
  @ApiProperty({ enum: ['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT'] })
  @IsEnum(['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT'])
  movement_type: string;

  @ApiProperty()
  @IsUUID()
  warehouse_id: string;

  @ApiProperty()
  @IsUUID()
  item_id: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  unit_cost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  reference_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class StockTransferDto {
  @ApiProperty()
  @IsUUID()
  from_warehouse_id: string;

  @ApiProperty()
  @IsUUID()
  to_warehouse_id: string;

  @ApiProperty()
  @IsUUID()
  item_id: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class StockAdjustmentDto {
  @ApiProperty()
  @IsUUID()
  warehouse_id: string;

  @ApiProperty()
  @IsUUID()
  item_id: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  new_quantity: number;

  @ApiProperty()
  @IsString()
  reason: string;
}

export class InventoryFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  warehouse_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  item_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  movement_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
