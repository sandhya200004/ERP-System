import { Module } from '@nestjs/common';
import { TaxService } from './tax.service';
import { TaxController } from './tax.controller';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { AuditModule } from '../../shared/audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [TaxController],
  providers: [TaxService],
  exports: [TaxService],
})
export class TaxModule {}
