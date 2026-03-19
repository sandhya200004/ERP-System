import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsEnum([
    'CEO',
    'CTO',
    'CMO',
    'HR',
    'MANAGER',
    'DEVELOPER',
    'DESIGNER',
    'MARKETING',
    'RND',
    'EMPLOYEE',
    'STUDENT',
  ])
  role?: string;

  @IsOptional()
  @IsString()
  managerId?: string;
}
