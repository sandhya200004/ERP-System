import { Module } from '@nestjs/common';
import { ItemService } from './item.service';
import { ItemController } from './item.controller';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { AuditModule } from '../../shared/audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ItemController],
  providers: [ItemService],
  exports: [ItemService],
})
export class ItemModule {}
