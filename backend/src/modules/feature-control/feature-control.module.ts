import { Module } from '@nestjs/common';
import { FeatureControlController } from './feature-control.controller';
import { FeatureControlService } from './feature-control.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { AuditModule } from '../../shared/audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [FeatureControlController],
  providers: [FeatureControlService],
  exports: [FeatureControlService],
})
export class FeatureControlModule {}
