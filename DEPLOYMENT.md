# TriVerse ERP - Production Deployment Guide

## Prerequisites
- Node.js 18+ installed
- PostgreSQL 14+ running
- Domain configured (if deploying to server)
- SSL certificate (recommended for production)

## Environment Setup

### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/triverse_erp"

# JWT Secrets (CHANGE THESE IN PRODUCTION!)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Server
NODE_ENV="production"
PORT=3000

# CORS (Update with your frontend domain)
CORS_ORIGIN="http://localhost:5173"
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api/v1
```

## Production Build Steps

### 1. Backend Build
```powershell
cd "N:\PROJECTS\TriVerse ERP\backend"

# Install dependencies
npm ci --production=false

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build TypeScript
npm run build

# Test the build
node dist/main.js
```

### 2. Frontend Build
```powershell
cd "N:\PROJECTS\TriVerse ERP\frontend"

# Install dependencies
npm ci

# Build for production
npm run build

# Output will be in: dist/ folder
```

## Deployment Options

### Option 1: Windows Server with PM2

#### Install PM2
```powershell
npm install -g pm2
npm install -g pm2-windows-startup
pm2-startup install
```

#### Start Backend
```powershell
cd "N:\PROJECTS\TriVerse ERP\backend"

# Start with PM2
pm2 start dist/main.js --name "triverse-backend" `
  --env production `
  --max-memory-restart 1G `
  --error "logs/error.log" `
  --output "logs/output.log"

# Save PM2 config
pm2 save

# Check status
pm2 status
pm2 logs triverse-backend
```

#### Serve Frontend with IIS or nginx

**Using IIS:**
1. Install IIS and URL Rewrite module
2. Copy `dist` folder contents to `C:\inetpub\wwwroot\triverse-erp`
3. Create web.config for SPA routing
4. Configure SSL certificate

**Using nginx:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root N:/PROJECTS/TriVerse ERP/frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 2: Docker Deployment

#### Backend Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --production=false

# Copy source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: triverse_erp
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/triverse_erp
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Option 3: Cloud Deployment (Azure/AWS/Google Cloud)

#### Azure App Service
```powershell
# Install Azure CLI
az login

# Create resource group
az group create --name triverse-erp --location eastus

# Create App Service plan
az appservice plan create --name triverse-plan --resource-group triverse-erp --sku B1

# Create backend web app
az webapp create --name triverse-backend --resource-group triverse-erp --plan triverse-plan --runtime "NODE:18-lts"

# Deploy backend
cd backend
az webapp up --name triverse-backend

# Create frontend static web app
az staticwebapp create --name triverse-frontend --resource-group triverse-erp --source ./frontend
```

## Production Checklist

### Security
- [x] Change JWT secrets in .env
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set secure cookie flags
- [ ] Enable rate limiting
- [ ] Configure firewall rules
- [ ] Update database passwords
- [ ] Enable database SSL connection

### Performance
- [ ] Enable gzip compression
- [ ] Configure CDN for static assets
- [ ] Set up database connection pooling
- [ ] Enable Redis for caching (optional)
- [ ] Configure log rotation

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure application monitoring (New Relic/DataDog)
- [ ] Set up database backups
- [ ] Configure health check endpoints
- [ ] Set up uptime monitoring

### Database
- [ ] Run final migrations: `npx prisma migrate deploy`
- [ ] Seed production data if needed
- [ ] Configure automated backups
- [ ] Set up read replicas (if high traffic)

## Quick Production Start (Local)

```powershell
# 1. Stop development servers
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

# 2. Build everything
cd "N:\PROJECTS\TriVerse ERP"
.\deploy-production.ps1

# 3. Start production servers
pm2 start ecosystem.config.js
```

## Rollback Procedure

```powershell
# Stop services
pm2 stop all

# Restore database backup
psql -U postgres -d triverse_erp < backup.sql

# Revert to previous deployment
git checkout <previous-commit>
npm run build

# Restart
pm2 restart all
```

## Support & Maintenance

- Regular database backups: Daily at 2 AM
- Log rotation: Weekly
- Security updates: Monthly
- Performance review: Quarterly

## Troubleshooting

### Backend won't start
- Check `pm2 logs triverse-backend`
- Verify DATABASE_URL is correct
- Ensure PostgreSQL is running
- Check port 3000 is available

### Frontend 404 errors
- Verify SPA routing is configured
- Check nginx/IIS rewrite rules
- Ensure all assets are in dist folder

### Database connection errors
- Verify PostgreSQL service is running
- Check firewall allows port 5432
- Verify connection string format
- Test with: `psql -U postgres -d triverse_erp`

## Contact

For deployment support, contact your system administrator.
