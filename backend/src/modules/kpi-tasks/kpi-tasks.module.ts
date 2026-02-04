import { Module } from '@nestjs/common';
import { KpiTasksController } from './kpi-tasks.controller';
import { KpiTasksService } from './kpi-tasks.service';

@Module({
  controllers: [KpiTasksController],
  providers: [KpiTasksService],
  exports: [KpiTasksService],
})
export class KpiTasksModule {}
