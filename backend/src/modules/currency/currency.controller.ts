import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CurrencyService } from './currency.service';
import { CreateFxRateDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';

@ApiTags('Currencies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('currencies')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get()
  @RequirePermissions('currencies:read')
  @ApiOperation({ summary: 'Get all available currencies' })
  findAllCurrencies() {
    return this.currencyService.findAllCurrencies();
  }

  @Get(':code')
  @RequirePermissions('currencies:read')
  @ApiOperation({ summary: 'Get a currency by code' })
  findCurrencyByCode(@Param('code') code: string) {
    return this.currencyService.findCurrencyByCode(code);
  }

  @Post('fx-rates')
  @RequirePermissions('currencies:update')
  @ApiOperation({ summary: 'Create or update FX rate for a specific date' })
  upsertFxRate(@Body() createFxRateDto: CreateFxRateDto) {
    return this.currencyService.upsertFxRate(createFxRateDto);
  }

  @Get(':code/fx-rates')
  @RequirePermissions('currencies:read')
  @ApiOperation({ summary: 'Get FX rate history for a currency' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getFxRateHistory(
    @Param('code') code: string,
    @Query('limit') limit?: string,
  ) {
    return this.currencyService.getFxRateHistory(
      code,
      limit ? parseInt(limit) : 30,
    );
  }

  @Get(':code/fx-rates/:date')
  @RequirePermissions('currencies:read')
  @ApiOperation({ summary: 'Get FX rate for a specific date' })
  getFxRate(@Param('code') code: string, @Param('date') date: string) {
    return this.currencyService.getFxRate(code, new Date(date));
  }
}
