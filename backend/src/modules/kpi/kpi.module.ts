import { Module } from '@nestjs/common';
import { KpiController } from './kpi.controller';
import { KpiService } from './kpi.service';
import { KpiScoreService } from '../../services/kpiScoreService';

@Module({
  controllers: [KpiController],
  providers: [KpiService, KpiScoreService],
  exports: [KpiService],
})
export class KpiModule {}
