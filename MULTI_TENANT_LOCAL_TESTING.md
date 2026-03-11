# MULTI-TENANT SAAS - LOCAL DEVELOPMENT & TESTING GUIDE

## 🚀 QUICK START

### STEP 1: Apply Database Migrations

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Apply migrations
npx prisma migrate dev --name add_multi_tenant_support

# Or push schema changes without migration
npx prisma db push
```

### STEP 2: Start Backend Server

```bash
cd backend
npm run start:dev
```

Server runs on: http://localhost:3000

### STEP 3: Start Frontend Server

```bash
cd frontend
npm run dev
```

Frontend runs on: http://localhost:5173

---

## 🧪 TESTING MULTI-TENANT FEATURES

### **Method 1: Using Headers (Recommended for Development)**

Since subdomains don't work on localhost, use the `X-Tenant-Subdomain` header:

```bash
# Test with company "abc"
curl -H "X-Tenant-Subdomain: abc" \
     -H "Authorization: Bearer <token>" \
     http://localhost:3000/api/v1/customers

# Test platform admin
curl -H "X-Tenant-Subdomain: admin" \
     http://localhost:3000/api/v1/platform-admin/stats
```

### **Method 2: Modify /etc/hosts (Optional)**

Add to `/etc/hosts` (Linux/Mac) or `C:\Windows\System32\drivers\etc\hosts` (Windows):

```
127.0.0.1 abc.localhost
127.0.0.1 xyz.localhost
127.0.0.1 admin.localhost
```

Then access:
- http://abc.localhost:3000
- http://admin.localhost:3000

---

## 📝 TESTING WORKFLOW

### **1. Create First Platform Admin**

```bash
POST http://localhost:3000/api/v1/platform-admin/register
Content-Type: application/json

{
  "email": "admin@platform.com",
  "password": "Admin123!!",
  "first_name": "Platform",
  "last_name": "Admin",
  "phone": "+1234567890"
}
```

### **2. Login as Platform Admin**

```bash
POST http://localhost:3000/api/v1/platform-admin/login
Content-Type: application/json

{
  "email": "admin@platform.com",
  "password": "Admin123!!"
}
```

Save the `access_token` from response.

### **3. Create First Company**

```bash
POST http://localhost:3000/api/v1/platform-admin/companies
Content-Type: application/json
Authorization: Bearer <platform_admin_token>

{
  "name": "ABC Company",
  "subdomain": "abc",
  "admin_email": "admin@abc.com",
  "admin_password": "Password123!",
  "admin_first_name": "John",
  "admin_last_name": "Doe",
  "admin_phone": "+1234567890",
  "subscription_plan": "professional",
  "max_users": 20,
  "max_branches": 3,
  "currency_code": "USD"
}
```

### **4. Login as Company Admin**

```bash
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json
X-Tenant-Subdomain: abc

{
  "email": "admin@abc.com",
  "password": "Password123!"
}
```

### **5. Access Company Resources**

```bash
# Get customers for ABC company
GET http://localhost:3000/api/v1/customers
Authorization: Bearer <company_admin_token>
X-Tenant-Subdomain: abc
```

---

## 🔍 TESTING TENANT ISOLATION

### **Create Multiple Companies**

```bash
# Company ABC
{
  "name": "ABC Company",
  "subdomain": "abc",
  "admin_email": "admin@abc.com",
  ...
}

# Company XYZ
{
  "name": "XYZ Company",
  "subdomain": "xyz",
  "admin_email": "admin@xyz.com",
  ...
}
```

### **Verify Data Isolation**

1. Login to ABC company, create customer
2. Login to XYZ company
3. Try to access ABC's customer → Should fail (404 or empty)
4. Each company sees only their own data

### **Test Platform Admin Access**

Platform admins can:
- ✅ View all companies
- ✅ Create/suspend/delete companies
- ✅ View platform statistics
- ❌ Access company ERP features directly

Company admins can:
- ✅ Access their own ERP features
- ✅ Manage their users
- ❌ Access other companies' data
- ❌ Access platform admin features

---

## 🐛 DEBUGGING TIPS

### Check Tenant Detection

```typescript
// In any controller, add:
console.log('Tenant:', req.tenant);
console.log('Is Platform Admin:', req.isPlatformAdmin);
```

### Verify company_id in Queries

```typescript
// Check if Prisma queries include company_id
// Example in customers.service.ts:
async findAll(companyId: string) {
  return this.prisma.customers.findMany({
    where: { company_id: companyId },  // ✅ IMPORTANT
  });
}
```

### Test Middleware

```bash
# Should return 404 if subdomain doesn't exist
curl -H "X-Tenant-Subdomain: nonexistent" \
     http://localhost:3000/api/v1/customers

# Should return 403 if company suspended
# First, suspend a company, then try to access it
```

---

## 📊 POSTMAN COLLECTION SETUP

### Environment Variables

Create a Postman environment with:

```json
{
  "base_url": "http://localhost:3000/api/v1",
  "platform_admin_token": "",
  "abc_company_token": "",
  "xyz_company_token": "",
  "abc_subdomain": "abc",
  "xyz_subdomain": "xyz"
}
```

### Pre-request Script (for tenant header)

```javascript
// Add to collection-level pre-request script
pm.request.headers.add({
    key: 'X-Tenant-Subdomain',
    value: pm.environment.get('current_subdomain')
});
```

---

## 🎭 TESTING SCENARIOS

### Scenario 1: Company Creation

1. Login as platform admin
2. Create company "ABC"
3. Verify company created (GET /companies)
4. Login as company admin
5. Access ERP features

### Scenario 2: Suspension

1. Platform admin suspends company
2. Company admin tries to login → Should fail
3. Platform admin reactivates
4. Company admin can login again

### Scenario 3: Plan Limits

1. Create company with max_users = 5
2. Create 5 users successfully
3. Try to create 6th user → Should fail

### Scenario 4: Data Isolation

1. Company ABC creates invoice
2. Company XYZ tries to access ABC's invoice → 404
3. Each company has separate customer lists

### Scenario 5: Subdomain Validation

1. Try to create company with subdomain "admin" → Should fail (reserved)
2. Try to create company with subdomain "abc123" → Success
3. Try to create duplicate subdomain → Should fail

---

## 🔧 DATABASE INSPECTION

```bash
# Connect to database
psql -U postgres -d triverse_erp_dev

# Check companies
SELECT id, name, subdomain, status, subscription_plan FROM companies;

# Check platform admins
SELECT id, email, is_super_admin, is_active FROM platform_admins;

# Check tenant isolation (customers)
SELECT c.name as company, cu.name as customer 
FROM customers cu 
JOIN companies c ON cu.company_id = c.id;

# Check user assignments
SELECT u.email, c.name as company, r.name as role
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN companies c ON ur.company_id = c.id
JOIN roles r ON ur.role_id = r.id;
```

---

## 🐞 COMMON ISSUES & SOLUTIONS

### Issue: "No tenant subdomain found"

**Solution:** Add `X-Tenant-Subdomain` header to requests

```bash
curl -H "X-Tenant-Subdomain: abc" ...
```

### Issue: "Platform admin not found or inactive"

**Solution:** Check JWT token has `is_platform_admin: true`

```javascript
// Decode JWT at jwt.io
{
  "sub": "admin-id",
  "email": "admin@platform.com",
  "is_platform_admin": true  // ✅ Must be present
}
```

### Issue: "Subdomain already taken"

**Solution:** Use different subdomain or delete existing company

```bash
DELETE http://localhost:3000/api/v1/platform-admin/companies/:id
```

### Issue: Can't access company data after login

**Solution:** Check `company_id` in JWT token matches tenant

```javascript
// JWT should have:
{
  "sub": "user-id",
  "company_id": "abc-company-id",  // ✅ Must match
  ...
}
```

### Issue: CORS error in browser

**Solution:** Add subdomain to CORS whitelist in main.ts

```typescript
// In main.ts, update CORS:
origin: (origin, callback) => {
  if (origin.includes('localhost') || origin.includes('abc.localhost')) {
    return callback(null, true);
  }
  ...
}
```

---

## 💡 DEVELOPMENT TIPS

1. **Use Postman Collections:** Save all API requests for easy testing

2. **Environment Variables:** Switch between companies using environment variables

3. **Database Seeding:** Create script to seed test companies/users

4. **Mock Subdomains:** Use headers instead of actual subdomains locally

5. **Logging:** Add console.logs to middleware to debug tenant detection

6. **TypeScript:** Use `@Tenant()` decorator to access tenant info

```typescript
@Get()
async findAll(@Tenant() tenant: TenantInfo) {
  console.log('Current tenant:', tenant.name);
  return this.service.findAll(tenant.id);
}
```

---

## 📈 PERFORMANCE TESTING

### Test Concurrent Tenants

```bash
# Use Apache Bench or similar
ab -n 1000 -c 10 -H "X-Tenant-Subdomain: abc" \
   -H "Authorization: Bearer <token>" \
   http://localhost:3000/api/v1/customers
```

### Monitor Database Queries

```bash
# Enable Prisma query logging
# In schema.prisma:
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["tracing"]
}

# In code:
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

---

## ✅ PRE-PRODUCTION TESTING CHECKLIST

- [ ] Create platform admin successfully
- [ ] Create multiple companies
- [ ] Login to each company separately
- [ ] Verify data isolation between companies
- [ ] Test company suspension/reactivation
- [ ] Update company subscription plans
- [ ] Test platform statistics API
- [ ] Verify JWT tokens include correct claims
- [ ] Test rate limiting
- [ ] Test CORS with different origins
- [ ] Verify all queries include company_id
- [ ] Test error scenarios (invalid subdomain, etc.)
- [ ] Check audit logs captured correctly
- [ ] Performance test with multiple tenants

---

## 📚 USEFUL COMMANDS

```bash
# Reset database (⚠️ DATA LOSS)
npx prisma migrate reset

# Generate Prisma client
npx prisma generate

# View database in GUI
npx prisma studio

# Format Prisma schema
npx prisma format

# Check migrations status
npx prisma migrate status

# Create seed script
node backend/prisma/seed.js
```

---

## 🎯 NEXT STEPS

After local testing succeeds:

1. ✅ Verify all multi-tenant features work
2. ✅ Document any custom configurations
3. ✅ Prepare production environment variables
4. ✅ Follow DEPLOYMENT_GUIDE_PRODUCTION.md
5. ✅ Deploy to DigitalOcean or chosen cloud provider

---

## 📞 SUPPORT

For issues or questions:
1. Check this guide first
2. Review MULTI_TENANT_SAAS_ARCHITECTURE.md
3. Check API documentation at http://localhost:3000/api/docs
4. Contact development team

**Happy Testing! 🚀**
