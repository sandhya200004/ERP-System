# 🚀 MULTI-TENANT SAAS - QUICK REFERENCE

## 📦 SETUP (10 Minutes)

```bash
# 1. Apply Database Changes
cd backend
npx prisma generate
npx prisma db push

# 2. Start Backend
npm run start:dev

# 3. Start Frontend (new terminal)
cd ../frontend
npm run dev
```

---

## 🔑 CREATE FIRST PLATFORM ADMIN

```bash
POST http://localhost:3000/api/v1/platform-admin/register
Content-Type: application/json

{
  "email": "admin@platform.com",
  "password": "Admin123!!",
  "first_name": "Platform",
  "last_name": "Admin"
}
```

---

## 🏢 CREATE COMPANY

```bash
# 1. Login as platform admin
POST http://localhost:3000/api/v1/platform-admin/login
{ "email": "admin@platform.com", "password": "Admin123!!" }

# Save token from response

# 2. Create company
POST http://localhost:3000/api/v1/platform-admin/companies
Authorization: Bearer <YOUR_TOKEN>
Content-Type: application/json

{
  "name": "ABC Company",
  "subdomain": "abc",
  "admin_email": "admin@abc.com",
  "admin_password": "Password123!",
  "admin_first_name": "John",
  "admin_last_name": "Doe",
  "subscription_plan": "professional",
  "max_users": 20
}
```

---

## 🔐 LOGIN TO COMPANY

```bash
POST http://localhost:3000/api/v1/auth/login
X-Tenant-Subdomain: abc
Content-Type: application/json

{
  "email": "admin@abc.com",
  "password": "Password123!"
}
```

---

## 📊 ACCESS COMPANY DATA

```bash
# Add header to ALL company requests:
X-Tenant-Subdomain: abc
Authorization: Bearer <COMPANY_TOKEN>

# Example: Get customers
GET http://localhost:3000/api/v1/customers
```

---

## 🛠️ COMMON COMMANDS

```bash
# View all companies
GET /api/v1/platform-admin/companies

# Platform stats
GET /api/v1/platform-admin/stats

# Suspend company
POST /api/v1/platform-admin/companies/:id/suspend
{ "reason": "Payment failed" }

# Reactivate company
POST /api/v1/platform-admin/companies/:id/reactivate

# Update company plan
PATCH /api/v1/platform-admin/companies/:id
{ "subscription_plan": "enterprise", "max_users": 100 }
```

---

## 🐛 TROUBLESHOOTING

**"No tenant subdomain found"**
→ Add header: `X-Tenant-Subdomain: abc`

**"Company suspended"**
→ Reactivate: `POST /platform-admin/companies/:id/reactivate`

**"Subdomain already taken"**
→ Use different subdomain

**Can't access data after login**
→ Check JWT has correct `company_id`

---

## 📚 FULL DOCUMENTATION

- **Architecture:** `MULTI_TENANT_SAAS_ARCHITECTURE.md`
- **Deployment:** `DEPLOYMENT_GUIDE_PRODUCTION.md`
- **Testing:** `MULTI_TENANT_LOCAL_TESTING.md`
- **Summary:** `MULTI_TENANT_IMPLEMENTATION_SUMMARY.md`

---

## 🔗 USEFUL URLS

- **API Docs:** http://localhost:3000/api/docs
- **Database GUI:** `npx prisma studio`
- **Health Check:** http://localhost:3000/health

---

## 🎯 PRODUCTION CHECKLIST

- [ ] Apply migrations: `npx prisma migrate deploy`
- [ ] Update .env with production values
- [ ] Configure DNS (A records for @ and *)
- [ ] Install SSL certificate (Let's Encrypt)
- [ ] Deploy with PM2: `pm2 start ecosystem.config.json`
- [ ] Configure Nginx with wildcard subdomain
- [ ] Create first platform admin
- [ ] Test with first company

---

## 💡 QUICK TIPS

1. Use Postman collections for testing
2. Set environment variables per company
3. Test tenant isolation with 2+ companies
4. Check logs: `pm2 logs` or `tail -f logs/out.log`
5. Monitor: `pm2 monit`

---

## 📞 NEED HELP?

Check documentation files:
- Architecture & design
- Deployment steps
- Testing guide
- API reference
- Troubleshooting

**Your SaaS ERP is ready! 🚀**
