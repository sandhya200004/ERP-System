# ✅ PRODUCT REQUIREMENTS DOCUMENT (PRD)

**Product Name:** TriVerse ERP
**Goal:** Deliver a lightweight, modular ERP/CRM with Quotes → Invoices → Payments, Multi-Company, Multi-Currency, Taxes, Items, Customers, Enterprise API, and Accounting-Lite (double-entry).

**Version Target:** V1 Production-Ready
**Primary User:** SMEs needing invoicing + basic ERP without Odoo complexity.
**Tech:** NestJS + PostgreSQL; React + AntD.

---

## 1. PRODUCT SUMMARY

Build a modern, clean-room ERP/CRM system equivalent to IDURAR, but architecturally stronger and suitable for SaaS use.
Priorities: **Stability, correctness, extensibility, minimalism**.

System must support:

* Multi-company
* Multi-branch
* Multi-currency
* Quotes, Invoices, Payments
* Items, Taxes, Customers
* Accounting-lite (true double-entry)
* API for enterprise
* Public form for lead/quote
* Role-based access control (RBAC)
* Audit logging
* PDF generation
* Email dispatch

---

## 2. CORE PRINCIPLES

1. **Strict separation of concerns** (auth, accounting, sales, org, API).
2. **Immutable financial documents** after posting.
3. **Every financial action posts a journal entry** (no shortcuts).
4. **Org-level isolation** (no cross-company data leaks).
5. **Copilot-friendly code** (clean interfaces, schemas, explicit types, modular folders).
6. **Extensible API-first design**.

---

## 3. USER ROLES

1. **Super Admin (Platform level)**
   * Manages tenants (if multi-tenant SaaS).
   * Not part of normal org workflow.

2. **Org Admin (Company level)**
   * Manages branches
   * Manages users & roles
   * Full accounting/sales access

3. **Manager**
   * Can create/edit quotes, invoices
   * Approve payments
   * View reports

4. **Staff**
   * Create quotes/invoices
   * Cannot alter posted invoices

5. **Viewer**
   * Read-only access

RBAC will be permission-based, not role-based (roles map to permissions).

---

## 4. FEATURE SET (V1)

### 4.1 Authentication & Organization

**Requirements**

* Email-password login
* JWT access + refresh tokens
* 2FA (Phase 2)
* Company creation
* Branch creation
* Invite users
* Role assignment

**Copilot Implementation Hints**

* Create `/auth` module
* Use `passport-jwt` or NestJS `AuthGuard`
* Models: `User`, `Company`, `Branch`, `Role`, `UserRole`

---

### 4.2 Customers

**Create / Edit / Delete / View**
Fields:

* name
* email
* phone
* billing_address
* shipping_address
* GST/Tax details
* currency preference

**Constraints**

* Customer belongs to `company_id`
* Soft delete only

---

### 4.3 Items (Products/Services)

**Fields:**

* name
* type (goods/service)
* unit_price
* tax_group_id
* default currency
* description

---

### 4.4 Taxes

**Fields:**

* name (GST 18%, VAT 5%, etc.)
* rate
* type (GST/VAT/Other)
* jurisdiction (India, EU, etc.)

**Rules**

* Tax applied per item line
* Must support multiple taxes on a line (GST split CGST/SGST/IGST in Phase 2)

---

### 4.5 Quotes

**Flow:** Draft → Sent → Accepted → Converted to Invoice

**Required Functions**

* Create quote
* Add line items
* Apply discounts
* Tax calculation
* Convert to invoice
* PDF generation
* Email to client

**Fields:**

* quote_number
* customer_id
* currency
* fx_rate_snapshot
* subtotal, tax_total, total
* status
* line_items[]

---

### 4.6 Invoices

**Flow:** Draft → Final → Paid → Partially Paid → Overdue

**Required Functions**

* Create invoice
* Lock after "Final"
* Generate journal entries
* Apply payments
* PDF export
* Email

**Accounting-Lite:**
Upon invoice finalization, post to GL:

* Debit: Accounts Receivable
* Credit: Revenue
* Credit: Tax Payable

**Mandatory Fields**

* invoice_number
* customer_id
* due_date
* currency & FX rate
* totals

---

### 4.7 Payments

**Requirements**

* Apply to single or multiple invoices
* Support partial payments
* Handle currency mismatch via FX gain/loss

**Journal Posting**

* Debit: Cash/Bank
* Credit: Accounts Receivable

If FX difference exists:

* Debit/Credit: FX Gain/Loss

---

### 4.8 Double-Entry Accounting Engine

**Entities**

* `Account`
* `JournalEntry`
* `JournalLine`

**Posting Rules**
Every invoice, payment, refund, or credit note MUST create a journal entry.

**Core accounts for V1**

* Accounts Receivable
* Cash/Bank
* Revenue
* Tax Payable
* FX Gain
* FX Loss

---

### 4.9 Reporting

1. **Sales Report (by date)**
2. **A/R Aging**
3. **Tax Summary**
4. **Payment History**

---

### 4.10 Multi-Company & Multi-Branch

* Unique numbering sequence per company/branch
* Users scoped by company and optional branch
* No data cross-over

---

### 4.11 Multi-Currency

**Scope**

* Document-level currency
* FX snapshot at creation
* FX gain/loss on payment

---

### 4.12 Public Forms

* Public URL to create "Request for Quote"
* Leads stored under company

---

### 4.13 Enterprise API

**API Keys:**

* Scoped to company
* Rate limiting
* Read/write via REST endpoints

Endpoints:

* /api/customers
* /api/items
* /api/quotes
* /api/invoices
* /api/payments

---

## 5. NON-FUNCTIONAL REQUIREMENTS

### 5.1 Security

* JWT + refresh tokens
* Enforce user-company scoping on every query
* Audit log of:
  * entity created
  * edited
  * deleted
  * status changed

---

### 5.2 Performance

* Must handle 10k invoices/month without slowdown
* Background jobs for emails + PDFs

---

### 5.3 Reliability

* Idempotent financial operations
* Cannot accidentally double-post a journal transaction

---

### 5.4 UI/UX

* React + Ant Design
* Clean dashboard
* Minimal screens:
  * Quotes
  * Invoices
  * Payments
  * Customers
  * Items
  * Reports
  * Settings

---

## 6. DATA MODEL (HIGH-LEVEL)

### Tables (Required)

```
users
companies
branches
roles
permissions
role_permissions
user_roles
customers
items
taxes
quotes
quote_lines
invoices
invoice_lines
payments
payment_applications
currencies
fx_rates
accounts
journal_entries
journal_lines
audit_logs
public_leads
api_keys
```

---

## 7. API ENDPOINTS (MINIMUM VIABLE)

### Auth

* POST /auth/login
* POST /auth/refresh
* POST /auth/logout

### Customers

* GET /customers
* POST /customers
* GET /customers/:id
* PUT /customers/:id
* DELETE /customers/:id

### Items

* GET /items
* POST /items
* GET /items/:id
* PUT /items/:id
* DELETE /items/:id

### Quotes

* GET /quotes
* POST /quotes
* GET /quotes/:id
* PUT /quotes/:id
* POST /quotes/:id/send
* POST /quotes/:id/convert

### Invoices

* GET /invoices
* POST /invoices
* GET /invoices/:id
* PUT /invoices/:id
* POST /invoices/:id/finalize
* POST /invoices/:id/send

### Payments

* GET /payments
* POST /payments
* POST /payments/:id/apply

### Reports

* GET /reports/sales
* GET /reports/aging
* GET /reports/tax

---

## 8. DELIVERY ROADMAP (STRICT)

### Phase 1 — Foundations (Week 1–2)

* Auth
* Org/Branch
* RBAC
* Users
* Audit logs

### Phase 2 — Master Data (Week 2–3)

* Customers
* Items
* Taxes
* Currency & FX rates

### Phase 3 — Quotes (Week 3–4)

* CRUD
* Line items
* PDF
* Email
* Convert to invoice

### Phase 4 — Invoices (Week 4–6)

* Draft → Final
* PDF
* Email
* Journal posting

### Phase 5 — Payments (Week 6–7)

* Payment creation
* Partial payments
* FX gain/loss
* Journal posting

### Phase 6 — Accounting Engine (Week 7–8)

* Accounts
* Journals & Posting rules
* Ledger views

### Phase 7 — Reports (Week 8–9)

* A/R
* Sales
* Tax summary

### Phase 8 — Public Form + API (Week 9–10)

* API keys
* Public quote form

---

## 9. SUCCESS METRICS

* 10k+ invoices/month without performance degradation
* < 100ms average API response time
* Zero financial data inconsistencies
* 99.9% uptime
* Zero cross-company data leaks

---

## 10. OUT OF SCOPE (V1)

* Purchase orders
* Inventory management
* Payroll
* Full GL with trial balance
* Bank reconciliation
* Advanced reporting/BI
* Mobile apps
* Multi-language support
