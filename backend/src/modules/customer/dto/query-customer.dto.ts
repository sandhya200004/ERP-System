import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryCustomerDto {
  @ApiPropertyOptional({ description: 'Search by name, email, or phone' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by customer type', enum: ['BUSINESS', 'INDIVIDUAL'] })
  @IsOptional()
  @IsIn(['BUSINESS', 'INDIVIDUAL'])
  type?: 'BUSINESS' | 'INDIVIDUAL';

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
