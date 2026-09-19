import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

// Shared
import { PrismaModule } from './shared/prisma/prisma.module';
import { LoggerModule } from './shared/logger/logger.module';
import { HealthModule } from './shared/health/health.module';
import { CaslModule } from './shared/casl/casl.module';
import { EncryptionModule } from './shared/encryption/encryption.module';
import { AuditInterceptor } from './shared/interceptors/audit.interceptor';
import { TenantMiddleware } from './shared/middleware/tenant.middleware';

// Core Modules
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/company/company.module';
import { BranchModule } from './modules/branch/branch.module';
import { UserModule } from './modules/user/user.module';
import { RoleModule } from './modules/role/role.module';
import { PublicModule } from './modules/public/public.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { SettingsModule } from './modules/settings/settings.module';
// import { NotificationModule } from './modules/notification/notification.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { AuditModule } from './shared/audit/audit.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Scheduled tasks (cron jobs)
    ScheduleModule.forRoot(),

    // In-memory caching for performance
    CacheModule.register({
      isGlobal: true,
      ttl: 300000, // 5 minutes default TTL
      max: 100, // Maximum number of items in cache
    }),

    // Rate limiting - Strict limits for auth, lenient for others
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minute
        limit: 1000, // 100 requests per minute (default)
      },
      {
        name: 'auth',
        ttl: 60000, // 1 minute
        limit: 20, // 20 login attempts per minute (strict)
      },
    ]),

    // Shared security modules
    PrismaModule,
    LoggerModule,
    HealthModule,
    CaslModule, // CASL Authorization
    EncryptionModule, // Data encryption
    
    // Feature modules
    AuthModule,
    CompanyModule,
    BranchModule,
    UserModule,
    RoleModule,
    PublicModule,
    AttendanceModule,
    AuditModule,
    EmployeeModule,
    SettingsModule,
    DepartmentsModule,
  ],
  providers: [
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global audit trail interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply tenant middleware to all routes except health and public endpoints
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'health', method: RequestMethod.ALL },
        { path: 'health/(.*)', method: RequestMethod.ALL },
        { path: 'public/(.*)', method: RequestMethod.ALL },
      )
      .forRoutes('*');
  }
}
