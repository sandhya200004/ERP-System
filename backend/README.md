# TriVerse ERP Backend

NestJS-based REST API for TriVerse ERP system.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- pnpm (or npm)

## Installation

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials and settings
```

## Database Setup

```bash
# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Seed initial data
pnpm seed

# Open Prisma Studio (GUI for database)
pnpm prisma:studio
```

## Running the Application

```bash
# Development mode with watch
pnpm start:dev

# Production mode
pnpm build
pnpm start:prod

# Debug mode
pnpm start:debug
```

## API Documentation

Once running, visit:
- http://localhost:3000/api/docs

## Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:cov
```

## Project Structure

```
src/
├── auth/              # Authentication & authorization
├── organization/      # Companies, branches, users
├── accounting/        # Double-entry accounting engine
├── sales/             # Quotes, invoices, payments
├── master-data/       # Customers, items, taxes
├── reporting/         # Reports & analytics
├── api/               # Enterprise API layer
├── public/            # Public forms (no auth)
└── shared/            # Shared utilities & modules
    ├── prisma/        # Database service
    ├── audit/         # Audit logging
    ├── email/         # Email service
    ├── pdf/           # PDF generation
    ├── guards/        # Auth guards
    ├── decorators/    # Custom decorators
    └── interceptors/  # Custom interceptors
```

## Module Architecture

Each module follows this structure:
```
module-name/
├── dto/               # Data transfer objects
├── entities/          # Domain entities
├── guards/            # Module-specific guards
├── module-name.controller.ts
├── module-name.service.ts
├── module-name.module.ts
└── tests/
```

## Key Features

- ✅ JWT authentication with refresh tokens
- ✅ Multi-company & multi-branch support
- ✅ Role-based access control (RBAC)
- ✅ Audit logging
- ✅ Company-scoped data isolation
- ✅ API rate limiting
- ✅ OpenAPI/Swagger documentation
- ✅ Input validation
- ✅ Error handling
- ✅ Database migrations

## Development Guidelines

1. **Always scope by company**: Every query must include company_id
2. **Use DTOs**: All inputs/outputs use Data Transfer Objects
3. **Validate inputs**: Use class-validator decorators
4. **Log audits**: Use AuditService for all mutations
5. **Handle errors**: Use proper HTTP exceptions
6. **Write tests**: Unit tests for services, E2E for controllers
7. **Document APIs**: Use Swagger decorators
