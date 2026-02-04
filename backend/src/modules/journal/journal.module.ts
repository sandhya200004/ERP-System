import { Module } from '@nestjs/common';
import { JournalController } from './journal.controller';
import { JournalService } from './journal.service';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Module({
  controllers: [JournalController],
  providers: [JournalService, PrismaService],
  exports: [JournalService],
})
export class JournalModule {}
