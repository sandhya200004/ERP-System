import { Module } from '@nestjs/common';
import { EmployeeTaskController } from './employee-task.controller';
import { EmployeeTaskService } from './employee-task.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EmployeeTaskController],
  providers: [EmployeeTaskService],
  exports: [EmployeeTaskService],
})
export class EmployeeTaskModule {}
