# TRIVERSE ERP - MULTI-TENANT SAAS ARCHITECTURE

## 📋 OVERVIEW

TriVerse ERP has been transformed into a production-ready **multi-tenant SaaS platform** that allows multiple businesses to use the same codebase while maintaining complete data isolation.

**Key Features:**
- Subdomain-based tenant isolation (abc.myerp.com, xyz.myerp.com)
- Platform Admin Dashboard (admin.myerp.com)
- Automated company onboarding
- Subscription plan management
- Role-based access control (Platform Admin vs Company Admin)
- Production-ready security (Helmet, Rate Limiting, CORS)
- Scalable deployment (PM2, Nginx, PostgreSQL)

---

## 🏗️ ARCHITECTURE OVERVIEW

### **Two-Level Admin System**

```
┌─────────────────────────────────────────────────┐
│         PLATFORM ADMIN (Super Admin)             │
│         Access: admin.myerp.com                  │
│                                                   │
│  • Create/Manage Companies                       │
│  • Set Subscription Plans                        │
│  • Suspend/Reactivate Companies                  │
│  • View Platform Statistics                      │
│  • Monitor All Tenants                           │
└─────────────────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│  COMPANY ADMIN   │          │  COMPANY ADMIN   │
│  abc.myerp.com   │          │  xyz.myerp.com   │
│                  │          │                  │
│  • Manage Users  │          │  • Manage Users  │
│  • Departments   │          │  • Departments   │
│  • Inventory     │          │  • Inventory     │
│  • Sales         │          │  • Sales         │
│  • Vendors       │          │  • Vendors       │
│  • Reports       │          │  • Reports       │
└──────────────────┘          └──────────────────┘
```

---

## 🗄️ DATABASE DESIGN

### **Multi-Tenancy Implementation**

**Approach:** Row-Level Tenant Isolation

Every business table includes `company_id` to ensure data segregation:

```sql
-- Companies Table (Tenants)
CREATE TABLE companies (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    subdomain VARCHAR(50) UNIQUE,  -- abc, xyz, etc.
    subscription_plan VARCHAR(50),  -- trial, starter, professional, enterprise
    max_users INTEGER DEFAULT 5,
    max_branches INTEGER DEFAULT 1,
    max_storage_gb INTEGER DEFAULT 5,
    status VARCHAR(50),             -- active, trial, suspended, cancelled
    trial_ends_at TIMESTAMP,
    subscription_starts_at TIMESTAMP,
    subscription_ends_at TIMESTAMP,
    suspended_at TIMESTAMP,
    suspension_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Platform Admins (Super Admins)
CREATE TABLE platform_admins (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_super_admin BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- All Business Tables Include company_id
CREATE TABLE customers (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255),
    ...
);

CREATE TABLE invoices (
    id UUID PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    ...
);
```

**Indexes for Performance:**
```sql
CREATE INDEX idx_customers_company_id ON customers(company_id);
CREATE INDEX idx_invoices_company_id ON invoices(company_id);
CREATE INDEX idx_companies_subdomain ON companies(subdomain);
```

---

## 🔐 TENANT DETECTION MIDDLEWARE

**How it works:**

1. **Request comes in** → `abc.myerp.com/api/v1/invoices`
2. **Middleware extracts subdomain** → `abc`
3. **Looks up company** → `SELECT * FROM companies WHERE subdomain = 'abc'`
4. **Attaches to request** → `req.tenant = { id, name, subdomain, plan, ... }`
5. **All queries use company_id** → `SELECT * FROM invoices WHERE company_id = req.tenant.id`

**Local Development:**
- Use header: `X-Tenant-Subdomain: abc`
- Or access via: `http://localhost:3000` (tenant detection skipped)

---

## 🚀 PLATFORM ADMIN APIs

### **Authentication**

```bash
# Register first platform admin
POST /api/v1/platform-admin/register
{
  "email": "admin@myerp.com",
  "password": "SecurePass123!",
  "first_name": "Platform",
  "last_name": "Admin",
  "phone": "+1234567890"
}

# Login
POST /api/v1/platform-admin/login
{
  "email": "admin@myerp.com",
  "password": "SecurePass123!"
}
Response: { "access_token": "...", "admin": {...} }
```

### **Company Management**

```bash
# Create New Company
POST /api/v1/platform-admin/companies
Authorization: Bearer <token>
{
  "name": "ABC Company",
  "subdomain": "abc",
  "admin_email": "admin@abc.com",
  "admin_password": "Password123!",
  "admin_first_name": "John",
  "admin_last_name": "Doe",
  "subscription_plan": "professional",
  "max_users": 20,
  "max_branches": 3,
  "currency_code": "USD"
}

Response:
{
  "message": "Company created successfully",
  "company": {
    "id": "...",
    "name": "ABC Company",
    "subdomain": "abc",
    "status": "trial"
  },
  "admin": {
    "email": "admin@abc.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "login_url": "https://abc.myerp.com"
}

# List All Companies
GET /api/v1/platform-admin/companies?page=1&limit=20&status=active

# Get Company Details
GET /api/v1/platform-admin/companies/:id

# Update Company
PATCH /api/v1/platform-admin/companies/:id
{
  "max_users": 50,
  "subscription_plan": "enterprise"
}

# Suspend Company
POST /api/v1/platform-admin/companies/:id/suspend
{
  "reason": "Payment failed"
}

# Reactivate Company
POST /api/v1/platform-admin/companies/:id/reactivate

# Delete Company (Soft Delete)
DELETE /api/v1/platform-admin/companies/:id

# Platform Statistics
GET /api/v1/platform-admin/stats
Response:
{
  "total_companies": 150,
  "active_companies": 120,
  "trial_companies": 20,
  "suspended_companies": 10,
  "total_users": 3500,
  "new_companies_this_month": 15
}
```

---

## 🔒 SECURITY FEATURES

### **1. Helmet Security Headers**
- XSS Protection
- Content Security Policy
- HSTS (HTTP Strict Transport Security)
- No Sniff
- Frame Guard

### **2. Rate Limiting**
- Default: 100 requests/minute
- Auth endpoints: 5 requests/minute
- Prevents brute force attacks

### **3. CORS Protection**
- Whitelist-based origin validation
- Subdomain support
- Credentials allowed

### **4. Input Validation**
- class-validator for DTOs
- Whitelist mode (strips unknown properties)
- Transform mode (auto-type conversion)

### **5. JWT Authentication**
- Access tokens (12h expiry)
- Refresh tokens (7 days)
- Separate handling for platform admins

### **6. Password Security**
- bcrypt hashing (10 rounds)
- Minimum 8 characters
- No plain text storage

### **7. SQL Injection Prevention**
- Prisma ORM (parameterized queries)
- No raw SQL execution

---

## 📦 SUBSCRIPTION PLANS

```typescript
enum SubscriptionPlan {
  TRIAL = 'trial',           // 14 days, 5 users, 1 branch
  STARTER = 'starter',       // 10 users, 2 branches, 10GB
  PROFESSIONAL = 'professional', // 50 users, 5 branches, 50GB
  ENTERPRISE = 'enterprise', // Unlimited users, 20 branches, 200GB
  CUSTOM = 'custom'          // Custom limits
}
```

**Plan Features:**
| Plan | Max Users | Max Branches | Storage | Price |
|------|-----------|-------------|---------|-------|
| Trial | 5 | 1 | 5GB | Free (14 days) |
| Starter | 10 | 2 | 10GB | $49/month |
| Professional | 50 | 5 | 50GB | $199/month |
| Enterprise | Unlimited | 20 | 200GB | $499/month |
| Custom | Custom | Custom | Custom | Contact Sales |

---

## 🔄 CLIENT ONBOARDING FLOW

```
1. Platform Admin creates company
   ↓
2. System generates:
   • Subdomain (abc.myerp.com)
   • Company record in database
   • Admin user with Administrator role
   • Default permissions
   ↓
3. Platform Admin receives:
   • Login URL (https://abc.myerp.com)
   • Admin credentials
   ↓
4. Client receives credentials (email/manual)
   ↓
5. Client logs in to their ERP workspace
   ↓
6. Client configures:
   • Company details
   • Departments
   • Users
   • Inventory
   • Vendors
   ↓
7. Client starts using ERP
```

---

## 🌐 SUBDOMAIN ROUTING

**DNS Configuration:**

```
A Record:
  @ → server-ip

A Record:
  * → server-ip (wildcard for all subdomains)

A Record:
  admin → server-ip
```

**Nginx Configuration:**

```nginx
server {
    server_name *.myerp.com myerp.com;
    # Handles all subdomains
    
    location /api/ {
        proxy_pass http://localhost:3000;
        # Backend API
    }
    
    location / {
        root /var/www/triverse-erp/frontend/dist;
        # Frontend React app
    }
}
```

---

## 🎯 TENANT ISOLATION

**Database Level:**
- Every query includes `company_id` filter
- Prisma middleware auto-injects company_id
- Foreign key constraints with CASCADE delete

**Application Level:**
- Middleware validates tenant from subdomain
- JWT token includes company_id
- Guards check tenant access

**Testing Isolation:**
```typescript
// ❌ BAD - No tenant isolation
SELECT * FROM customers;

// ✅ GOOD - Tenant isolated
SELECT * FROM customers WHERE company_id = 'tenant-id';
```

---

## 📊 MONITORING & LOGGING

**PM2 Monitoring:**
```bash
pm2 monit                    # Real-time monitoring
pm2 logs                     # View logs
pm2 restart all              # Restart app
```

**Audit Logging:**
- All actions logged to `audit_logs` table
- Includes: user_id, company_id, action, entity_type, old_values, new_values
- Searchable and exportable

**Health Checks:**
- Endpoint: `/health`
- Checks: Database, Memory, CPU
- Used by load balancers

---

## 🔧 DEVELOPMENT vs PRODUCTION

| Feature | Development | Production |
|---------|------------|-----------|
| Subdomain Detection | Optional (header) | Required |
| HTTPS | Not required | Required (SSL) |
| CORS | Permissive | Strict |
| Error Details | Full stack trace | Generic messages |
| Logging | Console | Files + PM2 |
| Database | Local PostgreSQL | Managed DB |
| Process Manager | npm run start:dev | PM2 cluster mode |

---

## 🚨 TROUBLESHOOTING

### Subdomain not working locally
```bash
# Add to /etc/hosts (Linux/Mac) or C:\Windows\System32\drivers\etc\hosts (Windows)
127.0.0.1 abc.localhost
127.0.0.1 admin.localhost

# Or use X-Tenant-Subdomain header
curl -H "X-Tenant-Subdomain: abc" http://localhost:3000/api/v1/customers
```

### Company suspended error
```bash
# Reactivate via platform admin
POST /api/v1/platform-admin/companies/:id/reactivate
```

### Cannot access platform admin dashboard
- Ensure subdomain is 'admin'
- Use platform admin credentials (not company admin)
- Check JWT token includes `is_platform_admin: true`

---

## 📚 API DOCUMENTATION

Full API documentation available at:
- Development: http://localhost:3000/api/docs
- Production: https://myerp.com/api/docs

Generated using Swagger/OpenAPI.

---

## 🎓 BEST PRACTICES

1. **Always include company_id** in queries
2. **Validate tenant** before operations
3. **Use decorators** for tenant access: `@Tenant()`
4. **Test isolation** between tenants
5. **Monitor resource usage** per tenant
6. **Regular backups** per tenant
7. **Plan limits enforcement** (users, storage)
8. **Audit critical operations**

---

## 📞 SUPPORT & MAINTENANCE

**Regular Tasks:**
- Database backups (daily)
- Log rotation (weekly)
- SSL certificate renewal (auto with certbot)
- Security updates (monthly)
- Performance monitoring (continuous)

**Key Files:**
- Backend: `/var/www/triverse-erp/backend`
- Frontend: `/var/www/triverse-erp/frontend`
- Logs: `/var/www/triverse-erp/backend/logs`
- PM2: `~/.pm2/logs`
- Nginx: `/var/log/nginx`

---

## ✅ PRODUCTION READINESS CHECKLIST

Infrastructure:
- [ ] Database backups configured
- [ ] SSL certificates installed
- [ ] Firewall enabled
- [ ] Monitoring setup
- [ ] PM2 auto-restart enabled

Security:
- [ ] Strong passwords enforced
- [ ] JWT secrets rotated
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] Security headers enabled

Application:
- [ ] Migrations applied
- [ ] Platform admin created
- [ ] Test company verified
- [ ] Error handling tested
- [ ] Performance optimized

Documentation:
- [ ] Admin guide available
- [ ] User guide created
- [ ] API docs accessible
- [ ] Deployment guide followed
- [ ] Troubleshooting guide ready

---

## 🎉 CONCLUSION

TriVerse ERP is now a **fully functional multi-tenant SaaS platform** ready for production deployment. The system supports unlimited companies, each with their own subdomain, data isolation, and subscription management.

**Next Steps:**
1. Deploy to DigitalOcean following DEPLOYMENT_GUIDE_PRODUCTION.md
2. Create first platform admin
3. Onboard first client company
4. Monitor and scale as needed

For technical support, refer to the deployment guide or contact the development team.
