import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { company_status } from '@prisma/client';

export class CreatePlatformAdminDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

export class LoginPlatformAdminDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export enum SubscriptionPlan {
  TRIAL = 'trial',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
  CUSTOM = 'custom',
}

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  subdomain: string;

  @IsEmail()
  @IsNotEmpty()
  admin_email: string;

  @IsString()
  @MinLength(8)
  admin_password: string;

  @IsString()
  @IsNotEmpty()
  admin_first_name: string;

  @IsString()
  @IsNotEmpty()
  admin_last_name: string;

  @IsString()
  @IsOptional()
  admin_phone?: string;

  @IsEnum(SubscriptionPlan)
  @IsOptional()
  subscription_plan?: SubscriptionPlan;

  @IsInt()
  @Min(1)
  @IsOptional()
  max_users?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  max_branches?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  max_storage_gb?: number;

  @IsString()
  @IsOptional()
  currency_code?: string;
}

export class UpdateCompanyDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  subdomain?: string;

  @IsEnum(SubscriptionPlan)
  @IsOptional()
  subscription_plan?: SubscriptionPlan;

  @IsInt()
  @Min(1)
  @IsOptional()
  max_users?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  max_branches?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  max_storage_gb?: number;

  @IsEnum(company_status)
  @IsOptional()
  status?: company_status;
}

export class SuspendCompanyDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
