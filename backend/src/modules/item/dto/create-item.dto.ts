import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsIn, IsOptional, IsNumber, Min, MaxLength, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateItemDto {
  @ApiProperty({ description: 'Item name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: 'Item type', enum: ['goods', 'service'] })
  @IsIn(['goods', 'service'])
  itemType: 'goods' | 'service';

  @ApiPropertyOptional({ description: 'Item description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Unit price' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitPrice: number;

  @ApiPropertyOptional({ description: 'Unit of measure (e.g., pcs, kg, hours)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string;

  @ApiPropertyOptional({ description: 'SKU or product code' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @ApiPropertyOptional({ description: 'Is item active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({ description: 'Array of tax IDs to associate with this item' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  taxIds?: string[];
}
