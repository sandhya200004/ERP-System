import { IsString, IsEnum, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAccountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  account_number?: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ['asset', 'liability', 'equity', 'revenue', 'expense'] })
  @IsEnum(['asset', 'liability', 'equity', 'revenue', 'expense'])
  account_type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parent_account_id?: string;

  @ApiProperty()
  @IsString()
  currency_code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateAccountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parent_account_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class AccountFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  account_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
