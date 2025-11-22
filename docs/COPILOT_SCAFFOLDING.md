# Copilot Scaffolding Prompts

Step-by-step prompts for implementing each module using GitHub Copilot.

---

## Phase 1: Foundations (Week 1-2)

### 1.1 Auth Module

**Copilot Prompt:**
```
Create a NestJS authentication module with:
- JWT strategy using passport-jwt
- Local strategy for email/password login
- Refresh token rotation
- Auth guard for protecting routes
- Decorators for extracting current user
- DTOs for login, register, refresh
- Service methods: register, login, refresh, logout
- Controller endpoints: POST /auth/login, POST /auth/register, POST /auth/refresh, POST /auth/logout
- Password hashing with bcrypt
- Prisma integration for users and refresh_tokens tables
```

**Files to create:**
```
src/auth/
├── strategies/
│   ├── jwt.strategy.ts
│   └── local.strategy.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   └── local-auth.guard.ts
├── dto/
│   ├── login.dto.ts
│   ├── register.dto.ts
│   └── refresh.dto.ts
├── auth.controller.ts
├── auth.service.ts
└── auth.module.ts
```

---

### 1.2 Organization Module

**Copilot Prompt:**
```
Create a NestJS organization module for multi-company management with:
- Company CRUD operations
- Branch CRUD operations
- User-company-role associations
- Company scoping middleware
- DTOs for creating/updating companies and branches
- Service methods for managing companies, branches, and user assignments
- Controller endpoints for companies and branches
- Prisma integration with companies, branches, user_roles tables
- Ensure all queries are scoped by company_id
```

**Files to create:**
```
src/organization/
├── dto/
│   ├── create-company.dto.ts
│   ├── update-company.dto.ts
│   ├── create-branch.dto.ts
│   └── assign-user.dto.ts
├── guards/
│   └── company-scope.guard.ts
├── companies/
│   ├── companies.controller.ts
│   └── companies.service.ts
├── branches/
│   ├── branches.controller.ts
│   └── branches.service.ts
└── organization.module.ts
```

---

### 1.3 RBAC Module

**Copilot Prompt:**
```
Create a NestJS RBAC (Role-Based Access Control) module with:
- Roles and permissions management
- Permission guard that checks user permissions
- Decorators for requiring specific permissions
- Service for checking if user has permission
- Seed initial permissions
- DTOs for role and permission management
- Controller endpoints for roles and permissions
- Prisma integration with roles, permissions, role_permissions tables
```

**Files to create:**
```
src/auth/rbac/
├── decorators/
│   └── require-permissions.decorator.ts
├── guards/
│   └── permissions.guard.ts
├── dto/
│   ├── create-role.dto.ts
│   └── assign-permission.dto.ts
├── rbac.service.ts
└── rbac.controller.ts
```

---

### 1.4 Audit Module

**Copilot Prompt:**
```
Create a NestJS audit logging module with:
- Audit service for logging create/update/delete operations
- Audit interceptor that automatically logs controller actions
- Methods for logging: create, update, delete, status changes, login/logout
- Store old and new values in JSONB
- Store IP address and user agent
- Prisma integration with audit_logs table
```

**Already created** - See: `src/shared/audit/`

---

## Phase 2: Master Data (Week 2-3)

### 2.1 Customer Module

**Copilot Prompt:**
```
Create a NestJS customer management module with:
- Full CRUD operations for customers
- Pagination, search, and filtering
- DTOs with validation using class-validator
- Service methods scoped by company_id
- Controller with OpenAPI decorators
- Soft delete support
- Auto-generate customer numbers
- Audit logging on all mutations
- Prisma integration with customers table
- Export to CSV/Excel functionality
```

**Files to create:**
```
src/master-data/customers/
├── dto/
│   ├── create-customer.dto.ts
│   ├── update-customer.dto.ts
│   └── query-customer.dto.ts
├── customers.controller.ts
├── customers.service.ts
└── customers.module.ts
```

---

### 2.2 Items Module

**Copilot Prompt:**
```
Create a NestJS items (products/services) management module with:
- CRUD operations for items
- Support for goods and services types
- Tax association (many-to-many with taxes)
- Pagination and search
- DTOs with validation
- Service methods scoped by company_id
- Controller with OpenAPI decorators
- Auto-generate item numbers
- Audit logging
- Prisma integration with items and item_taxes tables
```

**Files to create:**
```
src/master-data/items/
├── dto/
│   ├── create-item.dto.ts
│   ├── update-item.dto.ts
│   └── query-item.dto.ts
├── items.controller.ts
├── items.service.ts
└── items.module.ts
```

---

### 2.3 Taxes Module

**Copilot Prompt:**
```
Create a NestJS tax management module with:
- CRUD operations for taxes
- Support for different tax types (GST, VAT, Sales Tax)
- Tax calculation utilities
- DTOs with validation
- Service methods scoped by company_id
- Controller with OpenAPI decorators
- Prisma integration with taxes table
```

**Files to create:**
```
src/master-data/taxes/
├── dto/
│   ├── create-tax.dto.ts
│   └── update-tax.dto.ts
├── taxes.controller.ts
├── taxes.service.ts
└── taxes.module.ts
```

---

### 2.4 Currency & FX Module

**Copilot Prompt:**
```
Create a NestJS currency and foreign exchange module with:
- List all available currencies
- Store daily FX rates
- Get FX rate for a specific date
- Calculate FX gain/loss
- DTOs for FX rate entry
- Service methods for FX calculations
- Controller for managing currencies and rates
- Prisma integration with currencies and fx_rates tables
```

**Files to create:**
```
src/master-data/currencies/
├── dto/
│   └── create-fx-rate.dto.ts
├── currencies.controller.ts
├── currencies.service.ts
└── currencies.module.ts
```

---

## Phase 3: Quotes (Week 3-4)

### 3.1 Quotes Module

**Copilot Prompt:**
```
Create a NestJS quotes module with:
- CRUD operations for quotes
- Quote line items with tax calculations
- Auto-generate quote numbers
- Status workflow: draft → sent → accepted/rejected/expired
- Calculate subtotal, tax, discount, total
- FX rate snapshot at creation
- DTOs for creating/updating quotes and lines
- Service methods scoped by company_id
- Controller with all CRUD endpoints
- Soft delete support
- Audit logging
- Prisma integration with quotes, quote_lines, quote_line_taxes tables
```

**Files to create:**
```
src/sales/quotes/
├── dto/
│   ├── create-quote.dto.ts
│   ├── update-quote.dto.ts
│   ├── quote-line.dto.ts
│   └── query-quote.dto.ts
├── quotes.controller.ts
├── quotes.service.ts
└── quotes.module.ts
```

---

### 3.2 Quote PDF Generation

**Copilot Prompt:**
```
Create a PDF generation service for quotes using Puppeteer with:
- Handlebars template for quote PDF
- Company logo and branding
- Quote details, line items, totals
- Terms and conditions
- Service method: generateQuotePdf(quoteId)
- Store PDF temporarily or return as buffer
- Template path: src/templates/quote.hbs
```

**Files to create:**
```
src/shared/pdf/
├── templates/
│   └── quote.hbs
├── pdf.service.ts
└── pdf.module.ts
```

---

### 3.3 Quote Email Service

**Copilot Prompt:**
```
Create an email service for sending quotes using NodeMailer with:
- Send quote email with PDF attachment
- Handlebars template for email body
- SMTP configuration from environment
- Service method: sendQuoteEmail(quoteId, to, cc, subject, message)
- Mark quote as "sent" after successful email
- Email template path: src/templates/emails/quote-email.hbs
```

**Files to create:**
```
src/shared/email/
├── templates/
│   └── quote-email.hbs
├── email.service.ts
└── email.module.ts
```

---

### 3.4 Convert Quote to Invoice

**Copilot Prompt:**
```
Create a service method in quotes module to convert quote to invoice with:
- Copy all quote data to new invoice
- Copy all line items
- Set invoice status to "draft"
- Link invoice back to quote
- Set quote status to "converted"
- Return created invoice
- Ensure transaction safety (rollback on error)
```

**Add to:** `src/sales/quotes/quotes.service.ts`

---

## Phase 4: Invoices (Week 4-6)

### 4.1 Invoices Module

**Copilot Prompt:**
```
Create a NestJS invoices module with:
- CRUD operations for invoices
- Invoice line items with tax calculations
- Auto-generate invoice numbers
- Status workflow: draft → final → sent → partially_paid → paid → overdue
- Calculate subtotal, tax, discount, total, amount_due
- FX rate snapshot at creation
- DTOs for creating/updating invoices and lines
- Service methods scoped by company_id
- Controller with all CRUD endpoints
- Finalize operation (makes invoice immutable)
- Soft delete support (only for drafts)
- Audit logging
- Prisma integration with invoices, invoice_lines, invoice_line_taxes tables
```

**Files to create:**
```
src/sales/invoices/
├── dto/
│   ├── create-invoice.dto.ts
│   ├── update-invoice.dto.ts
│   ├── invoice-line.dto.ts
│   └── query-invoice.dto.ts
├── invoices.controller.ts
├── invoices.service.ts
└── invoices.module.ts
```

---

### 4.2 Invoice Finalization & GL Posting

**Copilot Prompt:**
```
Create an invoice finalization service that:
- Validates invoice is in draft status
- Marks invoice as "final" and locks it
- Creates journal entry for the invoice
- Posts journal entry with:
  - Debit: Accounts Receivable (invoice total)
  - Credit: Revenue (subtotal)
  - Credit: Tax Payable (tax total)
- Links journal entry ID to invoice
- Updates invoice status to "final"
- Logs finalization in audit log
- Returns finalized invoice
```

**Add to:** `src/sales/invoices/invoices.service.ts`

---

### 4.3 Invoice PDF & Email

**Copilot Prompt:**
```
Create PDF and email templates for invoices similar to quotes:
- Invoice PDF template with company branding
- Invoice email template
- Service methods for generating PDF and sending email
- Mark invoice as "sent" after email
```

**Files to create:**
```
src/shared/pdf/templates/invoice.hbs
src/shared/email/templates/invoice-email.hbs
```

---

## Phase 5: Payments (Week 6-7)

### 5.1 Payments Module

**Copilot Prompt:**
```
Create a NestJS payments module with:
- CRUD operations for payments
- Auto-generate payment numbers
- Payment methods: cash, bank_transfer, credit_card, etc.
- FX rate snapshot at payment date
- DTOs for creating payments
- Service methods scoped by company_id
- Controller with all CRUD endpoints
- Audit logging
- Prisma integration with payments table
```

**Files to create:**
```
src/sales/payments/
├── dto/
│   ├── create-payment.dto.ts
│   └── apply-payment.dto.ts
├── payments.controller.ts
├── payments.service.ts
└── payments.module.ts
```

---

### 5.2 Payment Application to Invoices

**Copilot Prompt:**
```
Create a payment application service that:
- Applies payment to one or more invoices
- Calculates FX gain/loss if currencies differ
- Updates invoice amount_paid and amount_due
- Updates invoice status (partially_paid, paid)
- Creates payment_application records
- Creates journal entry:
  - Debit: Cash/Bank
  - Credit: Accounts Receivable
  - Debit/Credit: FX Gain/Loss (if applicable)
- Links journal entry to payment
- Ensures payment is not over-applied
- Returns updated payment with applications
```

**Add to:** `src/sales/payments/payments.service.ts`

---

## Phase 6: Accounting Engine (Week 7-8)

### 6.1 Chart of Accounts Module

**Copilot Prompt:**
```
Create a NestJS chart of accounts module with:
- CRUD operations for accounts
- Account types: asset, liability, equity, revenue, expense
- Parent-child account hierarchy
- Auto-generate account numbers
- System accounts (cannot be deleted)
- DTOs for creating/updating accounts
- Service methods scoped by company_id
- Controller with all CRUD endpoints
- Seed default accounts on company creation
- Prisma integration with accounts table
```

**Files to create:**
```
src/accounting/accounts/
├── dto/
│   ├── create-account.dto.ts
│   └── update-account.dto.ts
├── accounts.controller.ts
├── accounts.service.ts
└── accounts.module.ts
```

---

### 6.2 Journal Entries Module

**Copilot Prompt:**
```
Create a NestJS journal entries module with:
- Create journal entry with lines
- Validate debits = credits before posting
- Status workflow: draft → posted → voided
- Auto-generate entry numbers
- DTOs for creating journal entries and lines
- Service methods scoped by company_id
- Controller with endpoints
- Prevent editing posted entries
- Audit logging
- Prisma integration with journal_entries and journal_lines tables
```

**Files to create:**
```
src/accounting/journal/
├── dto/
│   ├── create-journal-entry.dto.ts
│   └── journal-line.dto.ts
├── journal.controller.ts
├── journal.service.ts
└── journal.module.ts
```

---

### 6.3 Posting Service

**Copilot Prompt:**
```
Create a posting service that provides helper methods for:
- Creating invoice journal entry
- Creating payment journal entry
- Creating FX gain/loss journal entry
- Auto-posting upon invoice finalization
- Auto-posting upon payment application
- Retrieving system account IDs (AR, Revenue, Tax, Cash, etc.)
```

**Files to create:**
```
src/accounting/posting/
├── posting.service.ts
└── posting.module.ts
```

---

## Phase 7: Reports (Week 8-9)

### 7.1 Sales Report

**Copilot Prompt:**
```
Create a sales report service and controller with:
- Query parameters: dateFrom, dateTo, groupBy (day/week/month/customer/item)
- Calculate total sales, tax, discount, invoice count
- Group by specified dimension
- Return summary and breakdown
- Export to CSV/Excel
- Controller endpoint: GET /reports/sales
```

**Files to create:**
```
src/reporting/sales/
├── dto/
│   └── sales-report-query.dto.ts
├── sales-report.controller.ts
└── sales-report.service.ts
```

---

### 7.2 A/R Aging Report

**Copilot Prompt:**
```
Create an accounts receivable aging report with:
- Query parameters: asOfDate, customerId (optional)
- Calculate outstanding invoices
- Group by aging buckets: Current, 1-30, 31-60, 61-90, 90+ days
- Return summary and customer-wise breakdown
- Controller endpoint: GET /reports/aging
```

**Files to create:**
```
src/reporting/aging/
├── dto/
│   └── aging-report-query.dto.ts
├── aging-report.controller.ts
└── aging-report.service.ts
```

---

### 7.3 Tax Summary Report

**Copilot Prompt:**
```
Create a tax summary report with:
- Query parameters: dateFrom, dateTo
- Calculate total taxable amount and tax collected per tax type
- Group by tax jurisdiction
- Return summary and breakdown
- Controller endpoint: GET /reports/tax
```

**Files to create:**
```
src/reporting/tax/
├── dto/
│   └── tax-report-query.dto.ts
├── tax-report.controller.ts
└── tax-report.service.ts
```

---

## Phase 8: Public Forms & API (Week 9-10)

### 8.1 Public Leads Form

**Copilot Prompt:**
```
Create a public leads module (no authentication) with:
- Public endpoint: POST /public/leads
- DTO for lead submission with validation
- Store lead in public_leads table
- Optional: Send notification email to company
- Rate limiting to prevent spam
- CORS enabled for this endpoint
```

**Files to create:**
```
src/public/leads/
├── dto/
│   └── create-lead.dto.ts
├── leads.controller.ts
└── leads.service.ts
```

---

### 8.2 API Keys Management

**Copilot Prompt:**
```
Create an API keys module with:
- CRUD operations for API keys
- Generate secure API key with prefix
- Hash API key before storing
- Scoped by company
- Set permissions and rate limits
- API key authentication guard
- Controller endpoints for key management
- Prisma integration with api_keys table
```

**Files to create:**
```
src/api/api-keys/
├── dto/
│   └── create-api-key.dto.ts
├── guards/
│   └── api-key.guard.ts
├── api-keys.controller.ts
└── api-keys.service.ts
```

---

### 8.3 Enterprise API Wrapper

**Copilot Prompt:**
```
Create enterprise API controllers that wrap existing modules with:
- API key authentication instead of JWT
- Same endpoints as regular API
- Additional rate limiting (stricter)
- Scoped by API key's company
- OpenAPI tags for "Enterprise API"
- Controllers: /api/enterprise/customers, /api/enterprise/invoices, etc.
```

**Files to create:**
```
src/api/enterprise/
├── enterprise-customers.controller.ts
├── enterprise-invoices.controller.ts
└── ...
```

---

## Frontend Implementation Prompts

### F1. Auth Feature

**Copilot Prompt:**
```
Create a React authentication feature with:
- Login page with email/password form
- Register page
- Auth store using Zustand with login, logout, refresh methods
- Auth service with API calls
- Protected route component
- Axios interceptor for adding auth token
- Axios interceptor for refreshing token on 401
- Store tokens in localStorage
```

**Files to create:**
```
src/features/auth/
├── components/
│   ├── LoginForm.tsx
│   └── RegisterForm.tsx
├── pages/
│   ├── LoginPage.tsx
│   └── RegisterPage.tsx
├── hooks/
│   └── useAuth.ts
└── index.ts
```

---

### F2. Customer Management Feature

**Copilot Prompt:**
```
Create a React customer management feature with:
- Customer list page with Ant Design Table
- Search and filter functionality
- Create/Edit customer modal with form
- Customer detail drawer
- Delete confirmation modal
- React Query hooks for CRUD operations
- Customer service for API calls
- TypeScript types for customer entity
```

**Files to create:**
```
src/features/customers/
├── components/
│   ├── CustomerList.tsx
│   ├── CustomerForm.tsx
│   └── CustomerDetail.tsx
├── hooks/
│   └── useCustomers.ts
├── types/
│   └── customer.types.ts
└── index.ts
```

---

### F3. Invoice Management Feature

**Copilot Prompt:**
```
Create a React invoice management feature with:
- Invoice list page with status filters
- Create/Edit invoice page with line items
- Invoice detail page showing all information
- Finalize invoice button with confirmation
- Send invoice modal
- PDF preview modal
- React Query hooks for invoice operations
- Invoice service for API calls
- Line item editor component with tax calculation
```

**Files to create:**
```
src/features/invoices/
├── components/
│   ├── InvoiceList.tsx
│   ├── InvoiceForm.tsx
│   ├── InvoiceDetail.tsx
│   ├── InvoiceLineItems.tsx
│   └── SendInvoiceModal.tsx
├── pages/
│   ├── InvoicesPage.tsx
│   ├── CreateInvoicePage.tsx
│   └── InvoiceDetailPage.tsx
├── hooks/
│   └── useInvoices.ts
└── index.ts
```

---

### F4. Dashboard

**Copilot Prompt:**
```
Create a React dashboard with:
- Sales overview cards (total sales, invoices, payments)
- Recent invoices table
- Outstanding payments chart using Recharts
- Quick action buttons
- Date range selector
- Dashboard service for fetching stats
- Responsive grid layout
```

**Files to create:**
```
src/features/dashboard/
├── components/
│   ├── SalesOverview.tsx
│   ├── RecentInvoices.tsx
│   ├── OutstandingChart.tsx
│   └── QuickActions.tsx
├── pages/
│   └── DashboardPage.tsx
└── index.ts
```

---

## Testing Prompts

### Backend Unit Tests

**Copilot Prompt:**
```
Create unit tests for CustomerService with:
- Mock PrismaService
- Test create customer
- Test get customer by ID
- Test update customer
- Test delete customer (soft delete)
- Test company scoping
- Use Jest
```

### Backend E2E Tests

**Copilot Prompt:**
```
Create E2E tests for customers endpoints with:
- Setup test database
- Test POST /customers
- Test GET /customers with pagination
- Test PUT /customers/:id
- Test DELETE /customers/:id
- Test authentication required
- Test company scoping
- Use Supertest
```

### Frontend Component Tests

**Copilot Prompt:**
```
Create tests for CustomerForm component with:
- Mock React Query
- Test form renders correctly
- Test form validation
- Test form submission
- Test error handling
- Use React Testing Library and Jest
```

---

## Deployment Prompts

### Docker Setup

**Copilot Prompt:**
```
Create Docker setup for TriVerse ERP with:
- Dockerfile for backend (multi-stage build)
- Dockerfile for frontend (multi-stage build)
- docker-compose.yml with:
  - PostgreSQL service
  - Backend service
  - Frontend service
  - Nginx reverse proxy
- Environment variables configuration
- Health checks
- Volume mounts for development
```

### CI/CD Pipeline

**Copilot Prompt:**
```
Create GitHub Actions workflow for:
- Run tests on pull request
- Build Docker images on merge to main
- Deploy to production on tag push
- Run database migrations
- Lint code
- Type check
```

---

## Database Migration Prompts

### Prisma Schema

**Copilot Prompt:**
```
Convert the PostgreSQL schema from docs/DATABASE_SCHEMA.sql into a Prisma schema file with:
- All models matching the SQL tables
- All enums
- All relationships
- All indexes
- @@map directives for snake_case table names
- Field-level @map directives for snake_case columns
```

**File to create:** `backend/prisma/schema.prisma`

### Seed Script

**Copilot Prompt:**
```
Create a Prisma seed script that:
- Creates initial permissions
- Creates default currency records
- Creates a sample company
- Creates an admin user
- Assigns admin role to user
- Creates default chart of accounts
```

**File to create:** `backend/prisma/seed.ts`

---

## Summary

Use these prompts sequentially as you build each phase. Each prompt is designed to be:

1. **Self-contained**: Complete enough for Copilot to generate working code
2. **Specific**: Includes all requirements and constraints
3. **Structured**: Follows the established architecture patterns
4. **Copilot-friendly**: Uses clear language that Copilot understands

Remember to:
- Review and test generated code
- Add error handling
- Add logging
- Add documentation
- Write tests
- Follow TypeScript best practices
