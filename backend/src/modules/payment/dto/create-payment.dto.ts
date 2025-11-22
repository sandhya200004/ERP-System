import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, Min, IsDateString, IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class PaymentApplicationDto {
  @ApiProperty({ description: 'Invoice ID to apply payment to' })
  @IsNotEmpty()
  @IsString()
  invoiceId: string;

  @ApiProperty({ description: 'Amount to apply to this invoice' })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;
}

export class CreatePaymentDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @ApiProperty({ description: 'Payment date (YYYY-MM-DD)' })
  @IsDateString()
  paymentDate: string;

  @ApiProperty({ description: 'Payment amount' })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'USD' })
  @IsString()
  currencyCode?: string;

  @ApiProperty({ 
    description: 'Payment method', 
    enum: ['cash', 'bank_transfer', 'credit_card', 'check', 'other'] 
  })
  @IsIn(['cash', 'bank_transfer', 'credit_card', 'check', 'other'])
  paymentMethod: string;

  @ApiPropertyOptional({ description: 'Reference number (check number, transaction ID, etc.)' })
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ description: 'Payment notes' })
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Invoice applications', type: [PaymentApplicationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentApplicationDto)
  applications: PaymentApplicationDto[];
}
