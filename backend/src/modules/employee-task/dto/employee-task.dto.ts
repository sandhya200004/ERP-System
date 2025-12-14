import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export class CreateEmployeeTaskDto {
  @ApiPropertyOptional({ example: 'uuid', description: 'User ID to assign the task to (defaults to current user)' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ example: '2025-11-14' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'Complete customer portal design' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Design and implement the customer dashboard' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Development' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: 'high', enum: TaskPriority })
  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @ApiProperty({ example: 'in_progress', enum: TaskStatus })
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @ApiProperty({ example: 6, description: 'Hours spent on task' })
  @IsNumber()
  @Min(0)
  @Max(24)
  hoursSpent: number;
}

export class UpdateEmployeeTaskDto {
  @ApiPropertyOptional({ example: '2025-11-14' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: 'Complete customer portal design' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Design and implement the customer dashboard' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Development' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'high', enum: TaskPriority })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ example: 'completed', enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ example: 8, description: 'Hours spent on task' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(24)
  hoursSpent?: number;
}

export class EmployeeTaskQueryDto {
  @ApiPropertyOptional({ example: '2025-11-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-11-30' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'completed', enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ example: 'high', enum: TaskPriority })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ example: 'Development' })
  @IsOptional()
  @IsString()
  category?: string;
}
