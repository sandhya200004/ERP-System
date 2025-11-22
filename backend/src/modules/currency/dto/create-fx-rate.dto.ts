import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFxRateDto {
  @ApiProperty({ description: 'Currency code (e.g., EUR, GBP)' })
  @IsNotEmpty()
  currencyCode: string;

  @ApiProperty({ description: 'Exchange rate to base currency' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  rate: number;

  @ApiProperty({ description: 'Date for this exchange rate (YYYY-MM-DD)' })
  @IsDateString()
  date: string;
}
