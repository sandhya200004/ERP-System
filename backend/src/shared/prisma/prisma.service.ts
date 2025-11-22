import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Enable soft delete middleware
   */
  enableSoftDelete() {
    this.$use(async (params: any, next: any) => {
      // Check if model has deleted_at field
      if (params.action === 'delete') {
        params.action = 'update';
        params.args['data'] = { deleted_at: new Date() };
      }

      if (params.action === 'deleteMany') {
        params.action = 'updateMany';
        if (params.args.data != undefined) {
          params.args.data['deleted_at'] = new Date();
        } else {
          params.args['data'] = { deleted_at: new Date() };
        }
      }

      return next(params);
    });
  }

  /**
   * Exclude soft deleted records by default
   */
  excludeDeleted() {
    this.$use(async (params: any, next: any) => {
      if (params.action === 'findUnique' || params.action === 'findFirst') {
        params.action = 'findFirst';
        params.args.where['deleted_at'] = null;
      }

      if (params.action === 'findMany') {
        if (params.args.where) {
          if (params.args.where.deleted_at == undefined) {
            params.args.where['deleted_at'] = null;
          }
        } else {
          params.args['where'] = { deleted_at: null };
        }
      }

      return next(params);
    });
  }
}
