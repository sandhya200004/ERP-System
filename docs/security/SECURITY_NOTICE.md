# Security Notice

## Sensitive Files Not Included in Repository

The following files contain sensitive information and are **NOT** committed to Git:

- `backend/.env` - Contains database credentials, JWT secrets, and API keys
- `backend/.env.production` - Production environment configuration
- `frontend/.env.local` - Local environment overrides

## Setup Instructions

1. Copy example files to create your environment files:

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend  
cp .env.example .env
```

2. Update the values in your `.env` files with your actual credentials:

### Generate JWT Secrets
Run this command to generate secure random secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use the output for `JWT_SECRET` and `JWT_REFRESH_SECRET`.

### Database Setup
Update `DATABASE_URL` with your PostgreSQL credentials:
```
postgresql://USERNAME:PASSWORD@localhost:5432/triverse_erp?schema=public
```

### Required Environment Variables

**Backend (.env)**:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - 256-bit random string
- `JWT_REFRESH_SECRET` - 256-bit random string
- `SMTP_*` - Email service credentials (optional)

**Frontend (.env)**:
- `VITE_API_URL` - Backend API URL (default: http://localhost:3000/api/v1)

## Never Commit These Files

Ensure these patterns are in `.gitignore`:
- `.env`
- `.env.local`
- `.env.production`
- `.env.*.local`

## Default Admin Credentials

After running `npm run seed`:
- Email: `admin@triverse.com`
- Password: `admin123`

⚠️ **Change this password immediately after first login!**
