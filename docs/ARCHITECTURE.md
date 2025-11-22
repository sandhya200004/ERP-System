# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Browser    │  │  Mobile App  │  │  External    │      │
│  │  (React UI)  │  │  (Future)    │  │  API Clients │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   API GATEWAY / NGINX                       │
│                    (Load Balancer)                          │
└─────────────────────────────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
│   REST API       │ │   Public     │ │  Enterprise API  │
│   (Authenticated)│ │   Endpoints  │ │  (API Key Auth)  │
└──────────────────┘ └──────────────┘ └──────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              APPLICATION LAYER (NestJS)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │   Auth     │  │Organization│  │ Accounting │           │
│  │   Module   │  │   Module   │  │   Module   │           │
│  └────────────┘  └────────────┘  └────────────┘           │
│                                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │   Sales    │  │Master Data │  │ Reporting  │           │
│  │   Module   │  │   Module   │  │   Module   │           │
│  └────────────┘  └────────────┘  └────────────┘           │
│                                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │   Public   │  │    API     │  │   Shared   │           │
│  │   Module   │  │   Module   │  │  Services  │           │
│  └────────────┘  └────────────┘  └────────────┘           │
└─────────────────────────────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
│   Prisma ORM     │ │  Email       │ │  PDF             │
│                  │ │  Service     │ │  Generator       │
└──────────────────┘ └──────────────┘ └──────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATA LAYER                                │
├─────────────────────────────────────────────────────────────┤
│                  PostgreSQL Database                        │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │
│  │ Users  │ │Companies│ │Customers│ │Invoices│ │Journal │  │
│  │Roles   │ │Branches │ │ Items  │ │Payments│ │Entries │  │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Module Dependencies

```
┌─────────────┐
│   Shared    │◄──────────┐
│   Modules   │           │
└─────────────┘           │
      ▲                   │
      │                   │
┌─────┴─────────────┐     │
│                   │     │
│  ┌──────────┐    │     │
│  │  Prisma  │    │     │
│  │ Service  │    │     │
│  └──────────┘    │     │
│                  │     │
│  ┌──────────┐   │     │
│  │  Audit   │   │     │
│  │ Service  │   │     │
│  └──────────┘   │     │
│                 │     │
└─────────────────┘     │
                        │
┌───────────────────────┼───────────────────────┐
│                       │                       │
▼                       ▼                       ▼
┌─────────────┐   ┌─────────────┐      ┌─────────────┐
│    Auth     │   │Organization │      │Master Data  │
│   Module    │   │   Module    │      │   Module    │
└─────────────┘   └─────────────┘      └─────────────┘
      │                  │                     │
      │                  │                     │
      └──────────┬───────┴──────────┬──────────┘
                 │                  │
                 ▼                  ▼
         ┌─────────────┐    ┌─────────────┐
         │    Sales    │    │ Accounting  │
         │   Module    │───▶│   Module    │
         └─────────────┘    └─────────────┘
                 │                  │
                 └─────────┬────────┘
                           │
                           ▼
                   ┌─────────────┐
                   │ Reporting   │
                   │   Module    │
                   └─────────────┘
```

---

## Data Flow: Invoice Creation to Payment

```
1. CREATE INVOICE
   │
   ├─► User: Create Invoice (Draft)
   │   └─► Sales Module → Invoice Service
   │       └─► Prisma → invoices table
   │
2. FINALIZE INVOICE
   │
   ├─► User: Finalize Invoice
   │   └─► Sales Module → Invoice Service
   │       ├─► Change status to 'final'
   │       ├─► Lock invoice (immutable)
   │       └─► Accounting Module → Posting Service
   │           └─► Create Journal Entry:
   │               ├─► Debit: Accounts Receivable
   │               ├─► Credit: Revenue
   │               └─► Credit: Tax Payable
   │
3. SEND INVOICE
   │
   ├─► User: Send Invoice
   │   └─► Sales Module → Invoice Service
   │       ├─► PDF Service → Generate PDF
   │       ├─► Email Service → Send Email
   │       └─► Update status to 'sent'
   │
4. RECEIVE PAYMENT
   │
   ├─► User: Create Payment
   │   └─► Sales Module → Payment Service
   │       └─► Prisma → payments table
   │
5. APPLY PAYMENT
   │
   └─► User: Apply Payment to Invoice
       └─► Sales Module → Payment Service
           ├─► Create payment_applications
           ├─► Update invoice amount_paid
           ├─► Update invoice status (partially_paid/paid)
           └─► Accounting Module → Posting Service
               └─► Create Journal Entry:
                   ├─► Debit: Cash/Bank
                   ├─► Credit: Accounts Receivable
                   └─► FX Gain/Loss (if applicable)
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SECURITY LAYERS                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Layer 1: NETWORK SECURITY                                 │
│  ┌──────────────────────────────────────────────┐          │
│  │ • HTTPS/TLS                                  │          │
│  │ • CORS Configuration                         │          │
│  │ • Rate Limiting                              │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
│  Layer 2: AUTHENTICATION                                   │
│  ┌──────────────────────────────────────────────┐          │
│  │ • JWT Tokens (Access + Refresh)              │          │
│  │ • Password Hashing (bcrypt)                  │          │
│  │ • Token Rotation                             │          │
│  │ • API Key Authentication (Enterprise)        │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
│  Layer 3: AUTHORIZATION                                    │
│  ┌──────────────────────────────────────────────┐          │
│  │ • Role-Based Access Control (RBAC)           │          │
│  │ • Permission Guards                          │          │
│  │ • Company Scoping                            │          │
│  │ • Branch Scoping                             │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
│  Layer 4: DATA SECURITY                                    │
│  ┌──────────────────────────────────────────────┐          │
│  │ • Input Validation (class-validator)         │          │
│  │ • SQL Injection Prevention (Prisma ORM)      │          │
│  │ • XSS Protection                             │          │
│  │ • Data Isolation (company_id filtering)      │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
│  Layer 5: AUDIT & MONITORING                               │
│  ┌──────────────────────────────────────────────┐          │
│  │ • Audit Logs (all mutations)                 │          │
│  │ • Error Logging                              │          │
│  │ • Access Logs                                │          │
│  │ • Performance Monitoring                     │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema Relationships

```
users ────┬──── user_roles ──── roles ──── role_permissions ──── permissions
          │
          ├──── refresh_tokens
          │
          └──── created_by (invoices, quotes, etc.)


companies ────┬──── branches
              │
              ├──── customers
              │
              ├──── items
              │
              ├──── taxes
              │
              ├──── quotes ──── quote_lines ──── quote_line_taxes
              │
              ├──── invoices ──── invoice_lines ──── invoice_line_taxes
              │                      │
              │                      └──── payment_applications ──── payments
              │
              ├──── accounts
              │
              ├──── journal_entries ──── journal_lines
              │
              └──── api_keys


currencies ────┬──── fx_rates
               │
               ├──── customers (default_currency)
               │
               └──── invoices, quotes, payments (currency_code)
```

---

## Accounting Engine Flow

```
SALES TRANSACTION
│
├─► Invoice Finalized
│   │
│   ├─► Create Journal Entry (Draft)
│   │   │
│   │   ├─► Add Line: Debit Accounts Receivable ($1,100)
│   │   ├─► Add Line: Credit Revenue ($1,000)
│   │   └─► Add Line: Credit Tax Payable ($100)
│   │
│   └─► Post Journal Entry
│       └─► Status: posted
│
└─► Payment Applied
    │
    ├─► Create Journal Entry (Draft)
    │   │
    │   ├─► Add Line: Debit Cash/Bank ($1,100)
    │   └─► Add Line: Credit Accounts Receivable ($1,100)
    │
    └─► Post Journal Entry
        └─► Status: posted


LEDGER EFFECT

Accounts Receivable:
  Debit:  $1,100  (Invoice)
  Credit: $1,100  (Payment)
  Balance: $0

Revenue:
  Credit: $1,000  (Invoice)
  Balance: $1,000 (Credit)

Tax Payable:
  Credit: $100    (Invoice)
  Balance: $100   (Credit)

Cash/Bank:
  Debit:  $1,100  (Payment)
  Balance: $1,100 (Debit)
```

---

## Multi-Tenancy Model

```
COMPANY A                    COMPANY B
├─ Branch 1                  ├─ Branch 1
│  ├─ User 1 (Manager)       │  └─ User 4 (Staff)
│  └─ User 2 (Staff)         │
├─ Branch 2                  └─ Branch 2
│  └─ User 3 (Staff)            └─ User 5 (Admin)
│
├─ Customers                 ├─ Customers
│  ├─ Customer A-1           │  └─ Customer B-1
│  └─ Customer A-2           │
│                            │
├─ Invoices                  └─ Invoices
│  └─ INV-A-001                 └─ INV-B-001
│
└─ Chart of Accounts         └─ Chart of Accounts


DATA ISOLATION RULES:
• All queries filtered by company_id
• Users can only access their company's data
• Journal entries scoped to company
• Numbering sequences per company/branch
• No cross-company data leaks
```

---

## API Request Lifecycle

```
1. CLIENT REQUEST
   │
   └─► HTTPS POST /api/v1/invoices
       Headers: Authorization: Bearer <token>
       Body: { invoice data }

2. NGINX / API GATEWAY
   │
   ├─► SSL/TLS Termination
   ├─► Rate Limiting Check
   └─► Forward to NestJS App

3. NESTJS MIDDLEWARE
   │
   ├─► CORS Check
   ├─► Body Parser
   └─► Logging

4. AUTHENTICATION GUARD
   │
   ├─► Extract JWT Token
   ├─► Verify Token Signature
   ├─► Extract User & Company Info
   └─► Attach to Request Object

5. AUTHORIZATION GUARD
   │
   ├─► Check User Permissions
   ├─► Verify Company Access
   └─► Allow/Deny Request

6. CONTROLLER
   │
   ├─► Validate DTO (class-validator)
   ├─► Extract Request Data
   └─► Call Service Method

7. SERVICE LAYER
   │
   ├─► Business Logic
   ├─► Company Scoping
   ├─► Prisma Queries
   └─► Return Result

8. DATABASE
   │
   ├─► Execute Query
   ├─► Return Data
   └─► Transaction (if needed)

9. AUDIT INTERCEPTOR
   │
   └─► Log Action to audit_logs

10. RESPONSE
    │
    ├─► Transform Data
    ├─► Serialize Response
    └─► Return JSON

11. CLIENT
    │
    └─► Receive Response
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      PRODUCTION                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │           Load Balancer / CDN                │          │
│  └──────────────────────────────────────────────┘          │
│                         │                                   │
│         ┌───────────────┼───────────────┐                  │
│         ▼               ▼               ▼                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐            │
│  │ NestJS   │    │ NestJS   │    │ NestJS   │            │
│  │ Instance │    │ Instance │    │ Instance │            │
│  │    #1    │    │    #2    │    │    #3    │            │
│  └──────────┘    └──────────┘    └──────────┘            │
│         │               │               │                  │
│         └───────────────┼───────────────┘                  │
│                         │                                   │
│                         ▼                                   │
│              ┌──────────────────┐                          │
│              │   PostgreSQL     │                          │
│              │   (Primary)      │                          │
│              └──────────────────┘                          │
│                         │                                   │
│                         ├─► Replica 1 (Read)               │
│                         └─► Replica 2 (Read)               │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │               React Frontend                 │          │
│  │          (Static Files on CDN)               │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │          Redis (Session/Cache)               │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack Summary

### Backend
- **Runtime**: Node.js 18+
- **Framework**: NestJS 10
- **Database**: PostgreSQL 14+
- **ORM**: Prisma 5
- **Authentication**: JWT (passport-jwt)
- **Validation**: class-validator
- **API Docs**: Swagger/OpenAPI
- **Email**: NodeMailer
- **PDF**: Puppeteer

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 5
- **UI Library**: Ant Design 5
- **State**: Zustand
- **Data Fetching**: React Query
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Language**: TypeScript 5

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose / K8s
- **CI/CD**: GitHub Actions
- **Monitoring**: (TBD)
- **Logging**: (TBD)

---

## Scalability Considerations

### Horizontal Scaling
- Stateless NestJS instances
- Load balancer distribution
- Database read replicas
- Redis for session storage

### Vertical Scaling
- Database indexing
- Query optimization
- Caching strategy
- Connection pooling

### Performance Targets
- API response time: < 100ms (p95)
- Page load time: < 2s
- Support: 10k+ invoices/month
- Concurrent users: 100+
