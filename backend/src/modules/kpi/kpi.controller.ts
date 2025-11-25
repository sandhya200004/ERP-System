import { Controller, Get, Post, Param, Query, UseGuards, Request } from '@nestjs/common';
import { KpiService } from './kpi.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('kpi')
@UseGuards(JwtAuthGuard)
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  @Get('employee/:id')
  async getEmployeeKPI(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.kpiService.getEmployeeKPI(
      id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('employee/:id/history')
  async getKPIHistory(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.kpiService.getKPIHistory(id, limit ? parseInt(limit) : 12);
  }

  @Get('team')
  async getTeamKPI(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.kpiService.getTeamKPI(
      req.user.company_id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Post('task/:id/recalculate')
  async recalculateTaskScore(@Param('id') id: string) {
    return this.kpiService.recalculateTaskScore(id);
  }

  @Post('employee/:id/publish-monthly')
  async publishMonthlyKPI(
    @Param('id') id: string,
    @Query('periodStart') periodStart: string,
    @Query('periodEnd') periodEnd: string,
  ) {
    return this.kpiService.publishMonthlyKPI(
      id,
      new Date(periodStart),
      new Date(periodEnd),
    );
  }
}
