import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/user.decorator';
import { ReportService } from './report.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('profit-loss')
  @Roles('ADMIN', 'LEAD_MANAGER')
  @ApiOperation({ summary: 'Get Profit & Loss report' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getProfitAndLoss(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportService.getProfitAndLoss(user.companyId, startDate, endDate);
  }

  @Get('balance-sheet')
  @Roles('ADMIN', 'LEAD_MANAGER')
  @ApiOperation({ summary: 'Get Balance Sheet' })
  async getBalanceSheet(@CurrentUser() user: any) {
    return this.reportService.getBalanceSheet(user.companyId);
  }

  @Get('cash-flow')
  @Roles('ADMIN', 'LEAD_MANAGER')
  @ApiOperation({ summary: 'Get Cash Flow statement' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getCashFlow(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportService.getCashFlow(user.companyId, startDate, endDate);
  }

  @Get('revenue-expenses-chart')
  @Roles('ADMIN', 'LEAD_MANAGER')
  @ApiOperation({ summary: 'Get revenue vs expenses chart data (last 5 months)' })
  async getRevenueExpensesChart(@CurrentUser() user: any) {
    return this.reportService.getRevenueExpensesChart(user.companyId);
  }

  @Get('revenue-by-category')
  @Roles('ADMIN', 'LEAD_MANAGER')
  @ApiOperation({ summary: 'Get revenue breakdown by product/service category' })
  async getRevenueByCategory(@CurrentUser() user: any) {
    return this.reportService.getRevenueByCategory(user.companyId);
  }

  @Get('tax-summary')
  @Roles('ADMIN', 'LEAD_MANAGER')
  @ApiOperation({ summary: 'Get tax summary' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getTaxSummary(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportService.getTaxSummary(user.companyId, startDate, endDate);
  }
}
