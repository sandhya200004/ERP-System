import { IsString, IsDateString, IsOptional, IsArray, ValidateNested, IsNumber, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JournalLineDto {
  @ApiProperty()
  @IsUUID()
  account_id: string;

  @ApiProperty()
  @IsNumber()
  debit_amount: number;

  @ApiProperty()
  @IsNumber()
  credit_amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateJournalEntryDto {
  @ApiProperty()
  @IsDateString()
  entry_date: string;

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
  description?: string;

  @ApiProperty({ type: [JournalLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines: JournalLineDto[];
}

export class JournalFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class FinancialReportDto {
  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;
}
