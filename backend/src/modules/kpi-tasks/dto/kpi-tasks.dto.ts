import { IsString, IsOptional, IsInt, Min, Max, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateKpiTaskDto {
  @ApiProperty({ example: 'user-uuid-here' })
  @IsUUID()
  assignedTo: string;

  @ApiProperty({ example: 'Complete customer onboarding documentation' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Prepare all documents required for customer registration' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 15, description: 'Task weightage (1-100)' })
  @IsInt()
  @Min(1)
  @Max(100)
  weightage: number;

  @ApiPropertyOptional({ example: '2025-12-31T23:59:59Z' })
  @IsOptional()
  deadline?: Date;
}

export class SubmitTaskDto {
  @ApiProperty({ example: 'task-uuid-here' })
  @IsUUID()
  taskId: string;

  @ApiPropertyOptional({ example: 'Completed all required documentation as per guidelines' })
  @IsOptional()
  @IsString()
  submissionNote?: string;
}

export class ReviewTaskDto {
  @ApiProperty({ example: 'task-uuid-here' })
  @IsUUID()
  taskId: string;

  @ApiProperty({ example: 'APPROVED', enum: ['APPROVED', 'REJECTED'] })
  @IsEnum(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({ example: 'Well done! All requirements met.' })
  @IsOptional()
  @IsString()
  feedback?: string;
}
