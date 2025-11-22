import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

// Shared
import { PrismaModule } from './shared/prisma/prisma.module';
import { LoggerModule } from './shared/logger/logger.module';
import { HealthModule } from './shared/health/health.module';

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

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Shared modules
    PrismaModule,
    LoggerModule,
    HealthModule,
    
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
  ],
})
export class AppModule {}
