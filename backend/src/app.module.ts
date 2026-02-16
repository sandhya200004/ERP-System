import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

// Shared
import { PrismaModule } from './shared/prisma/prisma.module';
import { LoggerModule } from './shared/logger/logger.module';
import { HealthModule } from './shared/health/health.module';
import { CaslModule } from './shared/casl/casl.module';
import { EncryptionModule } from './shared/encryption/encryption.module';
import { AuditInterceptor } from './shared/interceptors/audit.interceptor';

// Core Modules
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/company/company.module';
import { BranchModule } from './modules/branch/branch.module';
import { UserModule } from './modules/user/user.module';
import { RoleModule } from './modules/role/role.module';
import { CustomerModule } from './modules/customer/customer.module';
import { ItemModule } from './modules/item/item.module';
import { TaxModule } from './modules/tax/tax.module';
import { CurrencyModule } from './modules/currency/currency.module';
import { QuoteModule } from './modules/quote/quote.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { PaymentModule } from './modules/payment/payment.module';
import { AccountModule } from './modules/account/account.module';
import { JournalModule } from './modules/journal/journal.module';
import { ReportModule } from './modules/report/report.module';
import { PublicModule } from './modules/public/public.module';
import { EmployeeTaskModule } from './modules/employee-task/employee-task.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { FeatureControlModule } from './modules/feature-control/feature-control.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { KpiModule } from './modules/kpi/kpi.module';
import { KpiTasksModule } from './modules/kpi-tasks/kpi-tasks.module';
import { VendorModule } from './modules/vendor/vendor.module';
import { PurchaseOrderModule } from './modules/purchase-order/purchase-order.module';
import { WarehouseModule } from './modules/warehouse/warehouse.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AdminModule } from './modules/admin/admin.module';
import { SecurityModule } from './modules/security/security.module';
// import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Scheduled tasks (cron jobs)
    ScheduleModule.forRoot(),

    // Rate limiting - Strict limits for auth, lenient for others
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute (default)
      },
      {
        name: 'auth',
        ttl: 60000, // 1 minute
        limit: 5, // 5 login attempts per minute (strict)
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
    CustomerModule,
    ItemModule,
    TaxModule,
    CurrencyModule,
    QuoteModule,
    InvoiceModule,
    PaymentModule,
    AccountModule,
    JournalModule,
    ReportModule,
    PublicModule,
    EmployeeTaskModule,
    AttendanceModule,
    FeatureControlModule,
    EmployeeModule,
    KpiModule,
    KpiTasksModule,
    VendorModule,
    PurchaseOrderModule,
    WarehouseModule,
    InventoryModule,
    SettingsModule,
    SecurityModule,
    AdminModule,
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
export class AppModule {}
