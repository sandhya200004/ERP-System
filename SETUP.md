# TriVerse ERP - Quick Setup Guide

## Prerequisites
- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- Git (optional)

## Step 1: Database Setup (5 minutes)

### Option A: Using PostgreSQL (Recommended for Production)

1. **Install PostgreSQL** (if not already installed):
   - Download from: https://www.postgresql.org/download/
   - Or use Docker: `docker run --name triverse-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:14`

2. **Create Database**:
   ```powershell
   # Connect to PostgreSQL
   psql -U postgres

   # Create database
   CREATE DATABASE triverse_erp;

   # Exit psql
   \q
   ```

3. **Run Database Schema**:
   ```powershell
   # From project root
   psql -U postgres -d triverse_erp -f docs/DATABASE_SCHEMA.sql
   ```

### Option B: Using Docker Compose (Fastest)

```powershell
# Create docker-compose.yml in project root
cd "n:\PROJECTS\TriVerse ERP"

# Start PostgreSQL
docker-compose up -d
```

## Step 2: Backend Setup (3 minutes)

```powershell
# Navigate to backend
cd "n:\PROJECTS\TriVerse ERP\backend"

# Install dependencies (if not done)
npm install

# Create .env file (already created, update if needed)
# Edit .env and set your DATABASE_URL

# Generate Prisma Client
npx prisma generate

# Push schema to database (alternative to SQL file)
npx prisma db push

# Seed initial data (currencies & permissions)
npm run seed

# Start development server
npm run start:dev
```

The backend API will be available at:
- **API**: http://localhost:3000/api/v1
- **Swagger Docs**: http://localhost:3000/api/docs

## Step 3: Test the API

### Register a New User & Company

```powershell
# Using PowerShell
$body = @{
    email = "admin@example.com"
    password = "Admin123!"
    firstName = "Admin"
    lastName = "User"
    companyName = "My Company Ltd"
    currencyCode = "USD"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/register" -Method POST -Body $body -ContentType "application/json"
```

You should receive an access token and refresh token!

## Step 4: Frontend Setup (5 minutes)

```powershell
# Navigate to frontend
cd "n:\PROJECTS\TriVerse ERP\frontend"

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at: http://localhost:5173

## Verification Checklist

✅ PostgreSQL running on port 5432  
✅ Database `triverse_erp` created  
✅ Backend running on port 3000  
✅ Can access Swagger docs at http://localhost:3000/api/docs  
✅ Can register a new user via API  
✅ Frontend running on port 5173  

## Troubleshooting

### Database Connection Issues

**Error**: `Authentication failed against database server`

**Solution**:
1. Check PostgreSQL is running: `pg_isready`
2. Verify credentials in `.env` file
3. Update DATABASE_URL in backend/.env:
   ```
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/triverse_erp"
   ```

### Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:
```powershell
# Find process using port
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess

# Kill the process or change PORT in .env
```

### Prisma Client Not Generated

**Error**: `Cannot find module '@prisma/client'`

**Solution**:
```powershell
cd backend
npx prisma generate
```

## Next Steps

Now that your environment is running, you can:

1. **Explore the API** via Swagger: http://localhost:3000/api/docs
2. **Create test data**: Use the API to create customers, items, quotes, invoices
3. **Start development**: Follow `docs/COPILOT_SCAFFOLDING.md` to implement features
4. **Run tests**: `npm test` (when tests are added)

## Default Admin Credentials

After registering, you'll have:
- **Role**: Administrator (full access)
- **Company**: Your company name
- **Branch**: Main Branch (auto-created)
- **Permissions**: All permissions granted

## Production Deployment

See `docs/DEPLOYMENT.md` for production deployment instructions (coming soon).

## Need Help?

- 📚 Full Documentation: `docs/` folder
- 🏗️ Architecture: `docs/ARCHITECTURE.md`
- 🔧 API Reference: `docs/API_CONTRACTS.md`
- ✅ Progress Tracking: `docs/DEVELOPMENT_CHECKLIST.md`
