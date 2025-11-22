# Quick Start Implementation Guide

## 🎯 Goal
Get TriVerse ERP from zero to working Phase 1 in the fastest possible time.

---

## Prerequisites Installation

```powershell
# Install Node.js 18+ (if not installed)
# Download from: https://nodejs.org/

# Install pnpm globally
npm install -g pnpm

# Install PostgreSQL 14+ (if not installed)
# Download from: https://www.postgresql.org/download/windows/

# Verify installations
node --version
pnpm --version
psql --version
```

---

## Step 1: Database Setup (5 minutes)

```powershell
# Create database
createdb triverse_erp

# Or using psql
psql -U postgres
CREATE DATABASE triverse_erp;
\q

# Run the schema
cd "N:\PROJECTS\TriVerse ERP"
psql -U postgres -d triverse_erp -f docs/DATABASE_SCHEMA.sql
```

**Verify:**
```sql
psql -U postgres -d triverse_erp
\dt
-- Should show all tables
```

---

## Step 2: Backend Setup (10 minutes)

```powershell
# Navigate to backend
cd backend

# Install dependencies
pnpm install

# Copy environment file
copy .env.example .env

# Edit .env file with your settings
notepad .env
```

**Update these in .env:**
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/triverse_erp?schema=public"
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
```

**Create Prisma Schema:**

Create `backend/prisma/schema.prisma` and use Copilot with this prompt:

```
Convert the PostgreSQL schema from ../docs/DATABASE_SCHEMA.sql into a complete Prisma schema with all models, enums, relationships, and indexes. Use @@map and @map for snake_case database names.
```

**Generate Prisma Client:**
```powershell
pnpm prisma generate
```

**Start Backend:**
```powershell
pnpm start:dev
```

**Verify:**
- Open http://localhost:3000/api/docs
- Should see Swagger UI (may be empty initially)

---

## Step 3: Frontend Setup (10 minutes)

```powershell
# Open new terminal
cd "N:\PROJECTS\TriVerse ERP\frontend"

# Install dependencies
pnpm install

# Create minimal App.tsx
```

**Create `frontend/src/App.tsx`:**
```tsx
import { ConfigProvider } from 'antd';

function App() {
  return (
    <ConfigProvider>
      <div style={{ padding: '20px' }}>
        <h1>TriVerse ERP</h1>
        <p>System is running!</p>
      </div>
    </ConfigProvider>
  );
}

export default App;
```

**Create `frontend/src/main.tsx`:**
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'antd/dist/reset.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

**Create `frontend/index.html`:**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TriVerse ERP</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Start Frontend:**
```powershell
pnpm dev
```

**Verify:**
- Open http://localhost:5173
- Should see "TriVerse ERP - System is running!"

---

## Step 4: Implement Phase 1 - Auth Module (Day 1-2)

### 4.1 Create Prisma Schema

Use the full schema from `docs/DATABASE_SCHEMA.sql` converted to Prisma format.

### 4.2 Implement Auth Module

**Use Copilot to generate:**

```powershell
cd backend/src
```

**Prompt Copilot:**
```
Create complete NestJS authentication module in src/auth/ with:
- JWT & Local strategies
- Auth guards
- Login, register, refresh, logout endpoints
- Password hashing with bcrypt
- Refresh token rotation
- DTOs with validation
- Integration with Prisma users and refresh_tokens tables
```

**Key files to create:**
```
src/auth/
├── strategies/jwt.strategy.ts
├── strategies/local.strategy.ts
├── guards/jwt-auth.guard.ts
├── dto/login.dto.ts
├── dto/register.dto.ts
├── auth.controller.ts
├── auth.service.ts
└── auth.module.ts
```

### 4.3 Test Auth Endpoints

**Using Thunder Client or Postman:**

```http
POST http://localhost:3000/api/v1/auth/register
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "Test123!@#",
  "firstName": "Admin",
  "lastName": "User"
}
```

```http
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "Test123!@#"
}
```

**Expected Response:**
```json
{
  "user": { ... },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

## Step 5: Implement Organization Module (Day 2-3)

**Prompt Copilot:**
```
Create NestJS organization module in src/organization/ with:
- Companies CRUD
- Branches CRUD
- User-company-role associations
- Company scoping guard
- DTOs with validation
- Integration with Prisma
```

**Test:**
```http
POST http://localhost:3000/api/v1/companies
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Acme Corporation",
  "defaultCurrency": "USD",
  "email": "contact@acme.com"
}
```

---

## Step 6: Implement Customer Module (Day 3-4)

**Prompt Copilot:**
```
Create NestJS customers module in src/master-data/customers/ with:
- Full CRUD operations
- Pagination and search
- Auto-generate customer numbers
- Company scoping
- DTOs with validation
- Soft delete support
```

**Test:**
```http
POST http://localhost:3000/api/v1/customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "ABC Corporation",
  "type": "business",
  "email": "contact@abc.com",
  "defaultCurrency": "USD"
}
```

---

## Step 7: Frontend - Auth Pages (Day 4-5)

**Prompt Copilot:**
```
Create React authentication feature with:
- Login page using Ant Design Form
- Auth store using Zustand
- Auth service with Axios
- Protected route component
- Token storage in localStorage
```

**Test:**
- Navigate to http://localhost:5173
- See login form
- Enter credentials
- Successful login redirects to dashboard

---

## Step 8: Frontend - Dashboard (Day 5)

**Prompt Copilot:**
```
Create React dashboard layout with:
- Ant Design Layout (Header, Sider, Content)
- Navigation menu
- User dropdown
- Logout functionality
- Dashboard cards showing mock stats
```

---

## Step 9: Frontend - Customer Management (Day 6-7)

**Prompt Copilot:**
```
Create React customer management feature with:
- Customer list with Ant Design Table
- Create customer modal with form
- Edit customer functionality
- Delete with confirmation
- Search and pagination
- React Query for data fetching
```

---

## Development Workflow

### Daily Routine

1. **Morning:**
   - Pull latest changes
   - Check for breaking changes
   - Run database migrations if needed

2. **Development:**
   - Pick next feature from roadmap
   - Use Copilot prompts from COPILOT_SCAFFOLDING.md
   - Implement feature
   - Test manually
   - Write unit tests

3. **Evening:**
   - Commit changes
   - Push to feature branch
   - Create PR if feature complete

### Testing Checklist

For each endpoint:
- ✅ Test with valid data
- ✅ Test with invalid data
- ✅ Test authentication required
- ✅ Test company scoping
- ✅ Test permissions (later)
- ✅ Test error responses

---

## Common Issues & Solutions

### Issue: Prisma Client not generated
```powershell
pnpm prisma generate
```

### Issue: Database connection error
- Check DATABASE_URL in .env
- Verify PostgreSQL is running
- Test connection: `psql -U postgres -d triverse_erp`

### Issue: Port already in use
```powershell
# Backend (port 3000)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Frontend (port 5173)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Issue: Module not found
```powershell
# Backend
cd backend
pnpm install

# Frontend
cd frontend
pnpm install
```

### Issue: CORS errors
- Check FRONTEND_URL in backend .env
- Verify proxy in frontend vite.config.ts

---

## Next Steps

After completing Phase 1 (Auth + Organization + Basic CRUD):

1. **Phase 2**: Items, Taxes, Currencies (Week 2-3)
2. **Phase 3**: Quotes module (Week 3-4)
3. **Phase 4**: Invoices module (Week 4-6)
4. **Phase 5**: Payments module (Week 6-7)
5. **Phase 6**: Accounting engine (Week 7-8)
6. **Phase 7**: Reports (Week 8-9)
7. **Phase 8**: Public forms + API (Week 9-10)

---

## Resources

- **NestJS Docs**: https://docs.nestjs.com/
- **Prisma Docs**: https://www.prisma.io/docs/
- **Ant Design**: https://ant.design/
- **React Query**: https://tanstack.com/query/latest
- **Zustand**: https://github.com/pmndrs/zustand

---

## Getting Help

1. Check error logs in terminal
2. Review API documentation at http://localhost:3000/api/docs
3. Check browser console for frontend errors
4. Review Prisma Studio for database state: `pnpm prisma studio`
5. Use Copilot for code generation and debugging

---

## Success Metrics

You know you're on track when:

- ✅ Backend starts without errors
- ✅ Frontend renders correctly
- ✅ Can register and login
- ✅ Can create company
- ✅ Can create customer
- ✅ All CRUD operations work
- ✅ Swagger docs are accessible
- ✅ Data persists in database
- ✅ No CORS errors
- ✅ No TypeScript errors

---

**You're now ready to build TriVerse ERP! 🚀**

Start with Phase 1, use the Copilot prompts, and build incrementally.
Each phase builds on the previous, so complete them in order.

Good luck!
