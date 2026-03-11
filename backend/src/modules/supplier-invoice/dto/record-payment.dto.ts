import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordPaymentDto {
  @ApiProperty({ description: 'Payment date (ISO format)' })
  @IsDateString()
  payment_date: string;

  @ApiProperty({ description: 'Payment amount', minimum: 0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Payment method (e.g., bank_transfer, check, cash)' })
  @IsString()
  payment_method: string;

  @ApiPropertyOptional({ description: 'Reference number (check number, transaction ID, etc.)' })
  @IsOptional()
  @IsString()
  reference_number?: string;

  @ApiPropertyOptional({ description: 'Payment notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
