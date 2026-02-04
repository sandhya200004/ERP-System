import { Module } from '@nestjs/common';
import { SeedController } from './seed.controller';
import { PrismaService } from '../../services/prisma.service';

@Module({
  controllers: [SeedController],
  providers: [PrismaService],
})
export class AdminModule {}
