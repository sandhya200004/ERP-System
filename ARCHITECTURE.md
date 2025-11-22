# TriVerse ERP - Architecture Overview

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  React Frontend (Vite + TypeScript + Ant Design)      │ │
│  │  - SPA with React Router                              │ │
│  │  - Zustand State Management                           │ │
│  │  - Ant Design UI Components                           │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS/REST API
┌───────────────────────────▼─────────────────────────────────┐
│                      Application Layer                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  NestJS Backend (Node.js + TypeScript)                │ │
│  │  - REST API Endpoints                                 │ │
│  │  - JWT Authentication                                 │ │
│  │  - Role-Based Access Control                          │ │
│  │  - Business Logic Services                            │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────┘
                            │ Prisma ORM
┌───────────────────────────▼─────────────────────────────────┐
│                       Data Layer                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  PostgreSQL Database                                   │ │
│  │  - Relational Data Storage                            │ │
│  │  - ACID Transactions                                  │ │
│  │  - Full-Text Search                                   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 5
- **Language**: TypeScript
- **UI Library**: Ant Design 5
- **State Management**: Zustand
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Form Handling**: Ant Design Forms

### Backend
- **Framework**: NestJS 10
- **Runtime**: Node.js 20
- **Language**: TypeScript
- **Database ORM**: Prisma 5
- **Authentication**: JWT + Passport
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI
- **PDF Generation**: Puppeteer
- **Email**: Nodemailer

### Database
- **RDBMS**: PostgreSQL 15
- **Features Used**:
  - JSONB columns for flexible data
  - Full-text search
  - Indexes for performance
  - Foreign keys for referential integrity
  - Soft deletes

### DevOps
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Web Server**: Nginx (for frontend)
- **Process Manager**: PM2 (alternative to Docker)

## Module Structure

### Backend Modules

```
src/
├── modules/
│   ├── auth/              # Authentication & authorization
│   ├── customer/          # Customer management
│   ├── item/              # Products/services
│   ├── invoice/           # Invoice generation & management
│   ├── quote/             # Quote/estimate handling
│   ├── payment/           # Payment recording
│   ├── report/            # Business reports
│   ├── attendance/        # Employee attendance
│   ├── employee-task/     # Task management
│   ├── role/              # Role & permission management
│   ├── currency/          # Multi-currency support
│   ├── tax/               # Tax calculation
│   └── company/           # Company settings
├── shared/
│   ├── prisma/            # Database service
│   ├── guards/            # Auth guards
│   ├── decorators/        # Custom decorators
│   ├── audit/             # Audit logging
│   ├── logger/            # Logging service
│   └── health/            # Health check
└── main.ts                # Application bootstrap
```

### Frontend Structure

```
src/
├── pages/                 # Page components
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── CustomersPage.tsx
│   ├── InvoicesPage.tsx
│   └── ...
├── layouts/               # Layout components
│   └── DashboardLayout.tsx
├── services/              # API services
│   ├── api.ts
│   ├── auth.service.ts
│   ├── customer.service.ts
│   └── ...
├── store/                 # State management
│   └── authStore.ts
├── components/            # Reusable components
├── hooks/                 # Custom hooks
└── utils/                 # Utility functions
```

## Data Flow

### Authentication Flow

```
1. User enters credentials
   └→ Frontend: LoginPage.tsx
      └→ API POST /auth/login
         └→ Backend: AuthController
            └→ AuthService.validateUser()
               └→ Database: Query users table
                  └→ Return user + JWT tokens
                     └→ Store tokens in localStorage
                        └→ Redirect to Dashboard
```

### Invoice Creation Flow

```
1. User creates invoice
   └→ Frontend: InvoicesPage.tsx
      └→ API POST /invoices
         └→ Backend: InvoiceController
            └→ JwtAuthGuard (verify token)
               └→ PermissionsGuard (check permissions)
                  └→ InvoiceService.create()
                     ├→ Generate invoice number
                     ├→ Calculate totals
                     ├→ Database: Insert invoice + line items
                     ├→ AuditService.log()
                     └→ Return created invoice
                        └→ Frontend: Update UI
```

## Security Architecture

### Authentication
- JWT-based stateless authentication
- Access tokens (15min) + Refresh tokens (7days)
- Secure password hashing (bcrypt, 10 rounds)
- Token rotation on refresh

### Authorization
- Role-Based Access Control (RBAC)
- Permission-based guards
- Resource-level authorization
- Company data isolation

### Data Protection
- SQL injection prevention (Prisma ORM)
- XSS protection (input validation)
- CSRF protection
- Rate limiting (100 req/min)
- CORS configuration
- HTTPS enforcement

### Audit Trail
- All mutations logged
- User action tracking
- IP address recording
- Timestamp tracking

## Database Schema

### Core Tables

**users**: User accounts
- Authentication credentials
- Profile information
- Relationships to companies via user_roles

**companies**: Organization data
- Company details
- Settings
- Default configurations

**roles**: Access roles
- Role definitions
- Company-specific

**permissions**: Granular permissions
- Resource-action pairs
- Assigned to roles via role_permissions

**customers**: Client information
- Contact details
- Billing information
- Payment terms

**items**: Products/Services
- Pricing information
- Inventory tracking
- Tax settings

**invoices**: Sales invoices
- Header information
- Status tracking
- Related to customers

**invoice_lines**: Invoice line items
- Item details
- Quantities and prices
- Tax calculations

**payments**: Payment records
- Amount and method
- Reference numbers
- Invoice allocation

**quotes**: Sales quotes
- Similar to invoices
- Expiry dates
- Conversion tracking

## API Design

### RESTful Principles
- Resource-based URLs
- HTTP methods (GET, POST, PATCH, DELETE)
- Proper status codes
- JSON payload

### Endpoint Pattern
```
GET    /api/v1/customers       # List all
GET    /api/v1/customers/:id   # Get one
POST   /api/v1/customers       # Create
PATCH  /api/v1/customers/:id   # Update
DELETE /api/v1/customers/:id   # Delete
```

### Response Format
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

### Error Format
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [...]
}
```

## Performance Considerations

### Frontend Optimization
- Code splitting
- Lazy loading
- Memoization (useMemo, useCallback)
- Virtual scrolling for large lists
- Debounced search inputs

### Backend Optimization
- Database query optimization
- Proper indexing
- Pagination on all lists
- Connection pooling
- Caching strategies

### Database Optimization
- Indexes on frequently queried columns
- Composite indexes for multi-column queries
- Partial indexes for filtered queries
- Query plan analysis

## Scalability

### Horizontal Scaling
- Stateless API (no session storage)
- Load balancer compatible
- Database connection pooling
- Read replicas for reporting

### Vertical Scaling
- Resource limits configurable
- Memory management
- CPU optimization

## Monitoring & Logging

### Application Logs
- Structured logging
- Log levels (error, warn, info, debug)
- Request/response logging
- Performance metrics

### Health Checks
- Database connectivity
- Memory usage
- Uptime tracking
- API endpoint testing

### Alerting
- Error rate monitoring
- Performance degradation
- Database connection issues
- Disk space warnings

## Backup & Recovery

### Database Backups
- Daily automated backups
- Point-in-time recovery
- Off-site backup storage
- Retention policy (30 days)

### Application Backups
- Docker image versioning
- Configuration backups
- Code repository (git)

### Disaster Recovery
- RTO: 4 hours
- RPO: 24 hours
- Documented recovery procedures
- Regular recovery testing

## Future Enhancements

### Planned Features
- Real-time notifications (WebSocket)
- Advanced analytics dashboard
- Mobile apps (React Native)
- API rate limiting per user
- Multi-tenancy improvements
- Scheduled reports
- Advanced workflow automation
- Integration marketplace

### Technical Debt
- Increase test coverage to 80%
- Implement caching layer (Redis)
- Add full-text search (Elasticsearch)
- Implement CDC for data sync
- Add API versioning strategy
- Improve error handling
- Add request tracing
