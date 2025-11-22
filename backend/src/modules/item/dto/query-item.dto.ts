import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsIn, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryItemDto {
  @ApiPropertyOptional({ description: 'Search by name, description, SKU, or item number' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by item type', enum: ['GOODS', 'SERVICE'] })
  @IsOptional()
  @IsIn(['GOODS', 'SERVICE'])
  type?: 'GOODS' | 'SERVICE';

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
