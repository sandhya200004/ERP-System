import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsIn, MaxLength } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ description: 'Customer name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: 'Customer type', enum: ['business', 'individual'] })
  @IsIn(['business', 'individual'])
  customerType: 'business' | 'individual';

  @ApiPropertyOptional({ description: 'Customer email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Customer phone' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ description: 'Billing address line 1' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  billingAddressLine1?: string;

  @ApiPropertyOptional({ description: 'Billing address line 2' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  billingAddressLine2?: string;

  @ApiPropertyOptional({ description: 'Billing city' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  billingCity?: string;

  @ApiPropertyOptional({ description: 'Billing state/province' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  billingState?: string;

  @ApiPropertyOptional({ description: 'Billing postal code' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  billingPostalCode?: string;

  @ApiPropertyOptional({ description: 'Billing country' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  billingCountry?: string;

  @ApiPropertyOptional({ description: 'Shipping address line 1' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  shippingAddressLine1?: string;

  @ApiPropertyOptional({ description: 'Shipping address line 2' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  shippingAddressLine2?: string;

  @ApiPropertyOptional({ description: 'Shipping city' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  shippingCity?: string;

  @ApiPropertyOptional({ description: 'Shipping state/province' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  shippingState?: string;

  @ApiPropertyOptional({ description: 'Shipping postal code' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  shippingPostalCode?: string;

  @ApiPropertyOptional({ description: 'Shipping country' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  shippingCountry?: string;

  @ApiPropertyOptional({ description: 'Tax number' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  taxNumber?: string;

  @ApiPropertyOptional({ description: 'Customer notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
