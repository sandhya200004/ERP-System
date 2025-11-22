import { IsString, IsOptional, IsLatitude, IsLongitude, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckInDto {
  @ApiProperty({ example: 18.5204, description: 'Latitude coordinate' })
  @IsLatitude()
  latitude: number;

  @ApiProperty({ example: 73.8567, description: 'Longitude coordinate' })
  @IsLongitude()
  longitude: number;

  @ApiPropertyOptional({ example: 'Pune Office' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'Starting daily tasks' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CheckOutDto {
  @ApiProperty({ example: 18.5204, description: 'Latitude coordinate' })
  @IsLatitude()
  latitude: number;

  @ApiProperty({ example: 73.8567, description: 'Longitude coordinate' })
  @IsLongitude()
  longitude: number;

  @ApiPropertyOptional({ example: 'Completed all tasks for today' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AttendanceQueryDto {
  @ApiPropertyOptional({ example: '2025-11-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-11-30' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'user-id-here' })
  @IsOptional()
  @IsString()
  userId?: string;
}
