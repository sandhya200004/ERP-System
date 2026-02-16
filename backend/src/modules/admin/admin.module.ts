import { Module } from '@nestjs/common';
import { SeedController } from './seed.controller';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Module({
  controllers: [SeedController],
  providers: [PrismaService],
})
export class AdminModule {}
