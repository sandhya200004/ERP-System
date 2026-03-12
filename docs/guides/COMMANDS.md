# 🚀 Quick Commands - TriVerse ERP

Copy-paste these commands to get started fast!

---

## 🗄️ Database Setup

### Option 1: Docker (Recommended)
```powershell
# Start PostgreSQL + pgAdmin
cd "n:\PROJECTS\TriVerse ERP"
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f postgres

# Stop when done
docker compose down
```

**Access**:
- PostgreSQL: `localhost:5432`
- pgAdmin: http://localhost:5050 (admin@triverse.local / admin)

### Option 2: Local PostgreSQL
```powershell
# Create database
createdb -U postgres triverse_erp

# Or using psql
psql -U postgres
CREATE DATABASE triverse_erp;
\q
```

### Option 3: SQLite (Development Only)
```powershell
# Edit backend/prisma/schema.prisma
# Line 11: Change to provider = "sqlite"

# Edit backend/.env
# Change DATABASE_URL="file:./dev.db"
```

---

## ⚙️ Backend Setup

```powershell
# Navigate to backend
cd "n:\PROJECTS\TriVerse ERP\backend"

# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push

# Seed initial data (currencies + permissions)
npm run seed

# Start development server
npm run start:dev
```

**Backend runs at**: http://localhost:3000  
**API Docs**: http://localhost:3000/api/docs

---

## 🎨 Frontend Setup

```powershell
# Navigate to frontend
cd "n:\PROJECTS\TriVerse ERP\frontend"

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend runs at**: http://localhost:5173

---

## 🧪 Testing the API

### Register First User

```powershell
$headers = @{ "Content-Type" = "application/json" }

$body = @{
    email = "admin@mycompany.com"
    password = "Admin123!"
    firstName = "John"
    lastName = "Doe"
    companyName = "My Company Ltd"
    currencyCode = "USD"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/register" -Method POST -Headers $headers -Body $body

Write-Host "Access Token: $($response.accessToken)"
Write-Host "Refresh Token: $($response.refreshToken)"
```

### Login

```powershell
$body = @{
    email = "admin@mycompany.com"
    password = "Admin123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" -Method POST -Headers $headers -Body $body

# Save token for later use
$token = $response.accessToken
Write-Host "Logged in! Token: $token"
```

### Get Current User

```powershell
$authHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/me" -Method GET -Headers $authHeaders
```

### Get Company Details

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/companies/me" -Method GET -Headers $authHeaders
```

---

## 🔧 Prisma Commands

```powershell
# Generate Prisma Client (after schema changes)
npx prisma generate

# Push schema changes to database
npx prisma db push

# Create a migration
npx prisma migrate dev --name description_of_change

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Format schema file
npx prisma format
```

**Prisma Studio**: http://localhost:5555

---

## 🐳 Docker Commands

```powershell
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Restart a service
docker compose restart postgres

# Remove volumes (⚠️ deletes database data)
docker compose down -v

# Rebuild images
docker compose up -d --build
```

---

## 📦 NPM Commands

### Backend

```powershell
cd backend

# Development
npm run start:dev        # Start with hot reload
npm run start:debug      # Start with debugger

# Build
npm run build            # Compile TypeScript

# Production
npm run start:prod       # Run production build

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:cov         # Generate coverage report

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format code with Prettier

# Database
npm run seed             # Seed currencies + permissions
npx prisma studio        # Open database GUI
```

### Frontend

```powershell
cd frontend

# Development
npm run dev              # Start dev server

# Build
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
```

---

## 🔍 Useful Queries

### Check PostgreSQL Connection

```powershell
# Test connection
pg_isready -h localhost -p 5432 -U postgres

# Connect to database
psql -U postgres -d triverse_erp

# List tables
\dt

# Describe table
\d users

# Exit
\q
```

### Check What's Running

```powershell
# Check port 3000 (backend)
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

# Check port 5173 (frontend)
Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue

# Check port 5432 (PostgreSQL)
Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
```

### Kill Process on Port

```powershell
# Find process on port 3000
$process = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($process) {
    Stop-Process -Id $process.OwningProcess -Force
    Write-Host "Killed process on port 3000"
}
```

---

## 🧹 Cleanup Commands

```powershell
# Remove node_modules
cd backend
Remove-Item -Recurse -Force node_modules

cd ../frontend
Remove-Item -Recurse -Force node_modules

# Remove build artifacts
cd ../backend
Remove-Item -Recurse -Force dist

cd ../frontend
Remove-Item -Recurse -Force dist

# Reinstall everything
cd ../backend
npm install

cd ../frontend
npm install
```

---

## 📊 Database Inspection

### Using Prisma Studio (GUI)

```powershell
cd backend
npx prisma studio
# Opens at http://localhost:5555
```

### Using psql (CLI)

```powershell
# Connect
psql -U postgres -d triverse_erp

# Useful queries
SELECT * FROM users;
SELECT * FROM companies;
SELECT * FROM permissions;
SELECT * FROM role_permissions;

# Check seeded data
SELECT COUNT(*) FROM currencies;      # Should be 9
SELECT COUNT(*) FROM permissions;     # Should be 75

# Exit
\q
```

---

## 🚨 Troubleshooting Commands

### "Database not found"

```powershell
# Create database
psql -U postgres -c "CREATE DATABASE triverse_erp;"

# Or
createdb -U postgres triverse_erp
```

### "Prisma Client not generated"

```powershell
cd backend
npx prisma generate
```

### "Port already in use"

```powershell
# Backend (port 3000)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

# Frontend (port 5173)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process -Force
```

### "Module not found"

```powershell
cd backend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
npx prisma generate
```

### Database connection error

```powershell
# Check PostgreSQL is running
docker compose ps
# or
pg_isready

# Check .env file
cat backend/.env | Select-String "DATABASE_URL"

# Verify credentials
psql -U postgres -d triverse_erp -c "SELECT 1;"
```

---

## 📝 Git Commands (If Using Version Control)

```powershell
# Initialize repo
git init
git add .
git commit -m "Initial commit - TriVerse ERP foundation"

# Create .gitignore (already exists)
# Add remote
git remote add origin <your-repo-url>
git push -u origin main
```

---

## 🎯 Quick Start (All Commands in Order)

```powershell
# 1. Start database
cd "n:\PROJECTS\TriVerse ERP"
docker compose up -d

# 2. Setup backend
cd backend
npm install
npx prisma generate
npx prisma db push
npm run seed
npm run start:dev

# 3. In new terminal: Setup frontend
cd "n:\PROJECTS\TriVerse ERP\frontend"
npm install
npm run dev

# 4. Test API
# Open browser: http://localhost:3000/api/docs

# 5. Register user (in another terminal)
$headers = @{ "Content-Type" = "application/json" }
$body = @{
    email = "admin@test.com"
    password = "Admin123!"
    firstName = "Admin"
    lastName = "User"
    companyName = "Test Company"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/register" -Method POST -Headers $headers -Body $body
```

---

## 🎉 Verification Checklist

Run these to verify everything works:

```powershell
# ✅ PostgreSQL is running
docker compose ps
# or
pg_isready

# ✅ Database exists
psql -U postgres -l | Select-String "triverse_erp"

# ✅ Prisma client generated
Test-Path "backend/node_modules/.prisma/client"

# ✅ Backend is running
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/me" -Method GET

# ✅ Swagger docs accessible
Start-Process "http://localhost:3000/api/docs"

# ✅ Frontend is running
Start-Process "http://localhost:5173"
```

---

## 💡 Pro Tips

```powershell
# Create PowerShell aliases for common commands
Set-Alias -Name start-backend -Value "cd 'n:\PROJECTS\TriVerse ERP\backend'; npm run start:dev"
Set-Alias -Name start-frontend -Value "cd 'n:\PROJECTS\TriVerse ERP\frontend'; npm run dev"

# Add to PowerShell profile for persistence
echo "Set-Alias start-backend ..." >> $PROFILE
```

---

Need help? Check `START_HERE.md` or `docs/` folder!
