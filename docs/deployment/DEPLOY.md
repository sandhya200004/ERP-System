# TriVerse ERP - Production Deployment Guide

## Quick Start

[Full deployment guide content as above - see DEPLOYMENT_GUIDE.md]

## Prerequisites

- Docker & Docker Compose
- PostgreSQL 15+
- Node.js 20+
- Domain with SSL
- SMTP service

## Environment Setup

Generate secrets:
```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

## Quick Deploy

```bash
# Clone and configure
git clone repo && cd triverse-erp
cp .env.example .env.production

# Edit .env.production with your values

# Deploy
docker-compose -f docker-compose.prod.yml up -d
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run seed
```

See full documentation in DEPLOYMENT_GUIDE.md
