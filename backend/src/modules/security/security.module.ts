import { Module } from '@nestjs/common';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';
import { AlertNotificationService } from './alert-notification.service';
import { SecurityMonitorService } from './security-monitor.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SecurityController],
  providers: [
    SecurityService,
    AlertNotificationService,
    SecurityMonitorService,
  ],
  exports: [SecurityService],
})
export class SecurityModule {}
