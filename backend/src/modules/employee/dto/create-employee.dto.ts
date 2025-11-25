import { IsString, IsEmail, IsOptional, IsDateString, IsEnum } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  designation: string;

  @IsString()
  department: string;

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
  ])
  role: string;

  @IsOptional()
  @IsString()
  managerId?: string;

  @IsDateString()
  joiningDate: string;
}
