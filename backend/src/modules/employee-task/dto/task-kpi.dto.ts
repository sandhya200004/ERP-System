import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ProofDto {
  @IsString()
  fileName: string;

  @IsString()
  filePath: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class PeerReviewDto {
  @IsString()
  reviewerId: string;

  @IsNumber()
  score: number;

  @IsOptional()
  @IsString()
  comment?: string;
}

class AutoCheckDto {
  @IsString()
  checkName: string;

  @IsBoolean()
  passed: boolean;
}

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  assignedTo: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsEnum(['trivial', 'small', 'medium', 'complex', 'critical'])
  complexity: string;

  @IsEnum(['low', 'medium', 'high'])
  priority: string;

  @IsNumber()
  estimatedHours: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsNumber()
  requiredChecks?: number;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['pending', 'in_progress', 'submitted', 'approved', 'completed', 'rejected', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsNumber()
  actualHours?: number;

  @IsOptional()
  @IsNumber()
  qualityScore?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PeerReviewDto)
  peerReviews?: PeerReviewDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AutoCheckDto)
  autoChecks?: AutoCheckDto[];
}

export class SubmitTaskDto {
  @IsNumber()
  actualHours: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProofDto)
  proofs: ProofDto[];
}

export class ApproveTaskDto {
  @IsBoolean()
  approved: boolean;

  @IsOptional()
  @IsNumber()
  qualityScore?: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}

export class AddPeerReviewDto {
  @IsNumber()
  score: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
