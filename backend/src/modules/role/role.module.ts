import { Module } from '@nestjs/common';
import { RoleSettingsController } from './role-settings.controller';
import { RoleSettingsService } from './role-settings.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RoleSettingsController],
  providers: [RoleSettingsService],
  exports: [RoleSettingsService],
})
export class RoleModule {}
