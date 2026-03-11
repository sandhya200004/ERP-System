import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveInvoiceDto {
  @ApiPropertyOptional({ description: 'Approval notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectInvoiceDto {
  @ApiPropertyOptional({ description: 'Rejection reason' })
  @IsOptional()
  @IsString()
  notes?: string;
}
