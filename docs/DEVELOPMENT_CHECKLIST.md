# TriVerse ERP - Development Checklist

Use this checklist to track your progress through all phases.

---

## 🔧 Environment Setup

- [ ] Node.js 18+ installed
- [ ] PostgreSQL 14+ installed
- [ ] pnpm installed globally
- [ ] Git installed and configured
- [ ] Code editor (VS Code recommended)
- [ ] Database client (pgAdmin or TablePlus)
- [ ] API testing tool (Thunder Client, Postman, or Insomnia)

---

## 📦 Project Initialization

- [ ] Database `triverse_erp` created
- [ ] Database schema executed (`DATABASE_SCHEMA.sql`)
- [ ] Backend dependencies installed (`cd backend && pnpm install`)
- [ ] Frontend dependencies installed (`cd frontend && pnpm install`)
- [ ] Backend `.env` file created from `.env.example`
- [ ] Environment variables configured (DATABASE_URL, JWT secrets)
- [ ] Prisma schema created (`backend/prisma/schema.prisma`)
- [ ] Prisma client generated (`pnpm prisma generate`)

---

## Phase 1: Foundations (Week 1-2)

### Authentication Module
- [ ] JWT strategy implemented
- [ ] Local strategy implemented
- [ ] Auth guards created
- [ ] Login DTO created
- [ ] Register DTO created
- [ ] Refresh DTO created
- [ ] Auth service implemented
- [ ] Auth controller implemented
- [ ] Password hashing working
- [ ] Refresh token rotation working
- [ ] **Test**: Can register new user
- [ ] **Test**: Can login with credentials
- [ ] **Test**: Can refresh access token
- [ ] **Test**: Can logout (revoke refresh token)

### Organization Module
- [ ] Company entity and DTOs created
- [ ] Branch entity and DTOs created
- [ ] Companies service implemented
- [ ] Branches service implemented
- [ ] Companies controller implemented
- [ ] Branches controller implemented
- [ ] Company scoping guard implemented
- [ ] **Test**: Can create company
- [ ] **Test**: Can update company
- [ ] **Test**: Can create branch
- [ ] **Test**: Can list branches for company
- [ ] **Test**: Company scoping prevents cross-company access

### RBAC Module
- [ ] Roles entity and DTOs created
- [ ] Permissions seeded in database
- [ ] Role service implemented
- [ ] Permission guard implemented
- [ ] `@RequirePermissions` decorator created
- [ ] RBAC controller implemented
- [ ] **Test**: Can create role
- [ ] **Test**: Can assign permissions to role
- [ ] **Test**: Can assign role to user
- [ ] **Test**: Permission guard blocks unauthorized access

### Audit Logging
- [ ] Audit service implemented (✅ Already created)
- [ ] Audit interceptor created
- [ ] Audit logging on all mutations
- [ ] **Test**: Audit logs capture create operations
- [ ] **Test**: Audit logs capture update operations
- [ ] **Test**: Audit logs capture delete operations

### Frontend - Auth
- [ ] Auth store created (Zustand)
- [ ] Auth service created (API calls)
- [ ] Login page created
- [ ] Register page created
- [ ] Protected route component created
- [ ] Axios interceptor for auth token
- [ ] Axios interceptor for token refresh
- [ ] **Test**: Can login from UI
- [ ] **Test**: Token refresh works automatically
- [ ] **Test**: Protected routes redirect to login

---

## Phase 2: Master Data (Week 2-3)

### Customers Module
- [ ] Customer entity and DTOs created
- [ ] Customer service implemented
- [ ] Customer controller implemented
- [ ] Auto-generate customer numbers
- [ ] Pagination and search implemented
- [ ] Soft delete implemented
- [ ] **Test**: Can create customer
- [ ] **Test**: Can update customer
- [ ] **Test**: Can delete customer (soft)
- [ ] **Test**: Can search customers
- [ ] **Test**: Pagination works correctly

### Items Module
- [ ] Item entity and DTOs created
- [ ] Item service implemented
- [ ] Item controller implemented
- [ ] Item-tax association implemented
- [ ] Auto-generate item numbers
- [ ] **Test**: Can create item
- [ ] **Test**: Can update item
- [ ] **Test**: Can delete item (soft)
- [ ] **Test**: Can associate taxes with items

### Taxes Module
- [ ] Tax entity and DTOs created
- [ ] Tax service implemented
- [ ] Tax controller implemented
- [ ] Tax calculation utilities created
- [ ] **Test**: Can create tax
- [ ] **Test**: Can update tax
- [ ] **Test**: Tax calculations are correct

### Currencies Module
- [ ] Currency entity seeded
- [ ] FX rate entity and DTOs created
- [ ] Currency service implemented
- [ ] Currency controller implemented
- [ ] FX gain/loss calculation implemented
- [ ] **Test**: Can add FX rate
- [ ] **Test**: Can get FX rate for date
- [ ] **Test**: FX gain/loss calculation correct

### Frontend - Master Data
- [ ] Customer list page created
- [ ] Customer form (create/edit) created
- [ ] Customer detail view created
- [ ] Item list page created
- [ ] Item form (create/edit) created
- [ ] Tax management UI created
- [ ] **Test**: Can manage customers from UI
- [ ] **Test**: Can manage items from UI
- [ ] **Test**: Search and filters work

---

## Phase 3: Quotes (Week 3-4)

### Quotes Module
- [ ] Quote entity and DTOs created
- [ ] Quote line entity and DTOs created
- [ ] Quote service implemented
- [ ] Quote controller implemented
- [ ] Line item calculations implemented
- [ ] Tax calculations on lines implemented
- [ ] Auto-generate quote numbers
- [ ] FX rate snapshot implemented
- [ ] **Test**: Can create quote
- [ ] **Test**: Can add line items
- [ ] **Test**: Calculations are correct
- [ ] **Test**: Can update quote (draft only)

### PDF Generation
- [ ] PDF service created
- [ ] Quote PDF template created (Handlebars)
- [ ] Company branding in PDF
- [ ] **Test**: Can generate quote PDF
- [ ] **Test**: PDF contains all data
- [ ] **Test**: PDF styling is correct

### Email Service
- [ ] Email service created
- [ ] Quote email template created
- [ ] SMTP configured
- [ ] **Test**: Can send quote email
- [ ] **Test**: PDF attached to email
- [ ] **Test**: Quote marked as "sent"

### Quote Conversion
- [ ] Convert quote to invoice implemented
- [ ] Transaction safety implemented
- [ ] **Test**: Can convert quote to invoice
- [ ] **Test**: Quote marked as "converted"
- [ ] **Test**: Invoice created with all data

### Frontend - Quotes
- [ ] Quote list page created
- [ ] Quote form created
- [ ] Line items editor created
- [ ] Send quote modal created
- [ ] Convert to invoice button
- [ ] **Test**: Can create quote from UI
- [ ] **Test**: Can edit line items
- [ ] **Test**: Can send quote
- [ ] **Test**: Can convert to invoice

---

## Phase 4: Invoices (Week 4-6)

### Invoices Module
- [ ] Invoice entity and DTOs created
- [ ] Invoice line entity and DTOs created
- [ ] Invoice service implemented
- [ ] Invoice controller implemented
- [ ] Line item calculations implemented
- [ ] Auto-generate invoice numbers
- [ ] **Test**: Can create invoice
- [ ] **Test**: Can update invoice (draft only)
- [ ] **Test**: Calculations are correct

### Invoice Finalization
- [ ] Finalize operation implemented
- [ ] Invoice locking implemented
- [ ] Status validation implemented
- [ ] **Test**: Can finalize invoice
- [ ] **Test**: Cannot edit finalized invoice
- [ ] **Test**: Validation prevents invalid finalization

### GL Posting on Invoice
- [ ] Posting service created
- [ ] Journal entry creation on finalize
- [ ] Debit AR, Credit Revenue, Credit Tax
- [ ] Journal entry linked to invoice
- [ ] **Test**: Journal entry created on finalize
- [ ] **Test**: Journal entry balances
- [ ] **Test**: Accounts updated correctly

### Invoice PDF & Email
- [ ] Invoice PDF template created
- [ ] Invoice email template created
- [ ] **Test**: Can generate invoice PDF
- [ ] **Test**: Can send invoice email
- [ ] **Test**: Invoice marked as "sent"

### Frontend - Invoices
- [ ] Invoice list page created
- [ ] Invoice form created
- [ ] Invoice detail page created
- [ ] Finalize button with confirmation
- [ ] Send invoice modal created
- [ ] PDF preview modal created
- [ ] **Test**: Can create invoice from UI
- [ ] **Test**: Can finalize invoice
- [ ] **Test**: Can send invoice

---

## Phase 5: Payments (Week 6-7)

### Payments Module
- [ ] Payment entity and DTOs created
- [ ] Payment service implemented
- [ ] Payment controller implemented
- [ ] Auto-generate payment numbers
- [ ] **Test**: Can create payment
- [ ] **Test**: Payment methods work
- [ ] **Test**: FX rate captured

### Payment Application
- [ ] Payment application entity created
- [ ] Apply payment to invoices implemented
- [ ] Partial payment support
- [ ] FX gain/loss calculation
- [ ] Invoice status update on payment
- [ ] **Test**: Can apply payment to invoice
- [ ] **Test**: Partial payments work
- [ ] **Test**: Invoice status updates correctly
- [ ] **Test**: FX gain/loss calculated correctly

### GL Posting on Payment
- [ ] Journal entry creation on payment
- [ ] Debit Cash, Credit AR
- [ ] FX Gain/Loss journal lines
- [ ] **Test**: Journal entry created on payment
- [ ] **Test**: FX gain/loss posted correctly
- [ ] **Test**: Accounts updated correctly

### Frontend - Payments
- [ ] Payment list page created
- [ ] Payment form created
- [ ] Apply payment modal created
- [ ] Invoice selector implemented
- [ ] **Test**: Can create payment from UI
- [ ] **Test**: Can apply to multiple invoices
- [ ] **Test**: Amount validation works

---

## Phase 6: Accounting Engine (Week 7-8)

### Chart of Accounts
- [ ] Account entity and DTOs created
- [ ] Account service implemented
- [ ] Account controller implemented
- [ ] Parent-child hierarchy implemented
- [ ] System accounts seeded
- [ ] **Test**: Can create account
- [ ] **Test**: Hierarchy works correctly
- [ ] **Test**: Cannot delete system accounts

### Journal Entries
- [ ] Journal entry entity created
- [ ] Journal line entity created
- [ ] Journal service implemented
- [ ] Journal controller implemented
- [ ] Debit/credit validation
- [ ] Balance validation before posting
- [ ] **Test**: Can create journal entry
- [ ] **Test**: Must balance to post
- [ ] **Test**: Cannot edit posted entry

### Posting Service
- [ ] Get system account IDs
- [ ] Helper methods for invoice posting
- [ ] Helper methods for payment posting
- [ ] **Test**: Auto-posting works
- [ ] **Test**: Accounts are correct
- [ ] **Test**: Entries balance

### Frontend - Accounting
- [ ] Chart of accounts page created
- [ ] Account form created
- [ ] Journal entry list created
- [ ] Journal entry detail created
- [ ] **Test**: Can manage accounts from UI
- [ ] **Test**: Can view journal entries

---

## Phase 7: Reports (Week 8-9)

### Sales Report
- [ ] Sales report service created
- [ ] Sales report controller created
- [ ] Date range filtering
- [ ] Grouping by dimension
- [ ] Export to CSV/Excel
- [ ] **Test**: Report generates correctly
- [ ] **Test**: Grouping works
- [ ] **Test**: Export works

### A/R Aging Report
- [ ] Aging report service created
- [ ] Aging report controller created
- [ ] Bucket calculations (Current, 1-30, etc.)
- [ ] Customer-wise breakdown
- [ ] **Test**: Aging calculated correctly
- [ ] **Test**: As-of-date works
- [ ] **Test**: Customer filter works

### Tax Summary Report
- [ ] Tax report service created
- [ ] Tax report controller created
- [ ] Tax breakdown by jurisdiction
- [ ] **Test**: Tax totals correct
- [ ] **Test**: Date filtering works

### Frontend - Reports
- [ ] Dashboard created with charts
- [ ] Sales report page created
- [ ] A/R aging page created
- [ ] Tax summary page created
- [ ] Date pickers for filters
- [ ] Charts using Recharts
- [ ] **Test**: Dashboard shows correct data
- [ ] **Test**: Reports load correctly
- [ ] **Test**: Charts render properly

---

## Phase 8: Public Forms & API (Week 9-10)

### Public Leads
- [ ] Public lead entity created
- [ ] Lead service implemented
- [ ] Lead controller (no auth)
- [ ] Rate limiting for public endpoint
- [ ] **Test**: Can submit lead from public form
- [ ] **Test**: Rate limiting prevents spam

### API Keys
- [ ] API key entity created
- [ ] API key service implemented
- [ ] API key controller implemented
- [ ] API key generation and hashing
- [ ] API key guard created
- [ ] **Test**: Can create API key
- [ ] **Test**: API key authentication works
- [ ] **Test**: Rate limiting per API key

### Enterprise API
- [ ] Enterprise controllers created
- [ ] API key auth on enterprise endpoints
- [ ] Stricter rate limiting
- [ ] **Test**: Enterprise API accessible with key
- [ ] **Test**: Rate limits enforced
- [ ] **Test**: Company scoping works

---

## Testing & Quality

### Backend Tests
- [ ] Unit tests for services (>80% coverage)
- [ ] E2E tests for critical flows
- [ ] Test company scoping
- [ ] Test permissions
- [ ] Test audit logging

### Frontend Tests
- [ ] Component tests for forms
- [ ] Integration tests for features
- [ ] E2E tests with Playwright/Cypress

### Manual Testing
- [ ] All CRUD operations work
- [ ] PDF generation works
- [ ] Email sending works
- [ ] Reports generate correctly
- [ ] No cross-company data leaks
- [ ] Permissions enforced correctly

---

## Documentation

- [ ] API documentation complete (Swagger)
- [ ] README files updated
- [ ] Deployment guide created
- [ ] User manual created
- [ ] API usage examples

---

## Deployment

- [ ] Dockerfile for backend
- [ ] Dockerfile for frontend
- [ ] docker-compose.yml created
- [ ] Environment variables documented
- [ ] Database migrations strategy
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Production configuration
- [ ] Monitoring and logging setup
- [ ] Backup strategy

---

## Security Checklist

- [ ] JWT secrets changed from defaults
- [ ] HTTPS enabled in production
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevented (Prisma)
- [ ] XSS protection enabled
- [ ] Sensitive data encrypted
- [ ] Audit logs enabled
- [ ] Error messages don't leak sensitive info

---

## Performance

- [ ] Database indexes optimized
- [ ] N+1 queries eliminated
- [ ] Pagination on all lists
- [ ] Caching strategy implemented
- [ ] API response times < 100ms (p95)
- [ ] Frontend bundle size optimized
- [ ] Images optimized
- [ ] Code splitting implemented

---

## Launch Readiness

- [ ] All critical features working
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Security checklist completed
- [ ] Performance benchmarks met
- [ ] Deployment successful
- [ ] Monitoring active
- [ ] Backup tested
- [ ] User acceptance testing passed
- [ ] Production data migration (if applicable)

---

## 🎉 Completion Status

**Total Items**: ~250
**Completed**: ___ / 250
**Progress**: ____%

---

**Track your progress by checking off items as you complete them!**
