# TriVerse ERP - Vercel + Render Deployment Guide

## 🚀 Deployment Architecture

- **Frontend**: Vercel (React + Vite)
- **Backend**: Render (NestJS API)
- **Database**: PostgreSQL (Render managed or external)

---

## 📋 Prerequisites

- ✅ GitHub account
- ✅ Vercel account (free tier available)
- ✅ Render account (free tier available)
- ✅ PostgreSQL database (Render provides free tier)

---

## 🔧 Part 1: Backend Deployment on Render

### Step 1: Prepare Backend for Render

The backend is already configured with:
- ✅ `render.yaml` - Render configuration
- ✅ `Procfile` - Alternative deployment method
- ✅ Build scripts in `package.json`

### Step 2: Create PostgreSQL Database on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `triverse-erp-db`
   - **Database**: `triverse_erp`
   - **User**: `triverse_admin`
   - **Region**: Oregon (or closest to you)
   - **Plan**: Free or Starter ($7/month)
4. Click **"Create Database"**
5. Copy the **Internal Database URL** (starts with `postgresql://`)

### Step 3: Deploy Backend to Render

#### Option A: Using render.yaml (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository: `Vrajm12/triverse-erp`
4. Render will auto-detect `render.yaml`
5. Set environment variables:
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars
   JWT_REFRESH_SECRET=your-refresh-secret-jwt-key-min-32-chars
   FRONTEND_URL=https://your-app.vercel.app
   NODE_ENV=production
   PORT=3000
   ```
6. Click **"Apply"**

#### Option B: Manual Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub repository: `Vrajm12/triverse-erp`
4. Configure:
   - **Name**: `triverse-erp-backend`
   - **Region**: Oregon
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: 
     ```bash
     npm install && npx prisma generate && npm run build
     ```
   - **Start Command**: 
     ```bash
     npm run start:prod
     ```
   - **Plan**: Free or Starter ($7/month)
5. Add Environment Variables (see above)
6. Click **"Create Web Service"**

### Step 4: Run Database Migrations

After deployment:

1. Go to your Render service
2. Click **"Shell"** tab (or use Render CLI)
3. Run:
   ```bash
   cd backend
   npx prisma db push
   ```

Or manually execute the migration SQL:
```bash
psql $DATABASE_URL -f backend/prisma/migrations/20251125_kpi_system_complete/migration.sql
```

### Step 5: Get Backend URL

Your backend will be available at:
```
https://triverse-erp-backend.onrender.com
```

Copy this URL for frontend configuration.

---

## 🎨 Part 2: Frontend Deployment on Vercel

### Step 1: Update API Base URL

1. Open `frontend/src/services/apiClient.ts`
2. Update the `baseURL`:
   ```typescript
   const apiClient = axios.create({
     baseURL: import.meta.env.VITE_API_URL || 'https://triverse-erp-backend.onrender.com/api/v1',
     timeout: 30000,
     headers: {
       'Content-Type': 'application/json',
     },
   });
   ```

3. Create `frontend/.env.production`:
   ```env
   VITE_API_URL=https://triverse-erp-backend.onrender.com/api/v1
   ```

### Step 2: Deploy to Vercel

#### Option A: Using Vercel CLI (Recommended)

1. Install Vercel CLI:
   ```powershell
   npm install -g vercel
   ```

2. Login to Vercel:
   ```powershell
   vercel login
   ```

3. Deploy from frontend directory:
   ```powershell
   cd "N:\PROJECTS\TriVerse ERP\frontend"
   vercel
   ```

4. Follow prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - Project name: `triverse-erp`
   - Directory: `./` (current)
   - Override settings? **N**

5. For production deployment:
   ```powershell
   vercel --prod
   ```

#### Option B: Using Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import GitHub repository: `Vrajm12/triverse-erp`
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Add Environment Variable:
   ```
   VITE_API_URL=https://triverse-erp-backend.onrender.com/api/v1
   ```
6. Click **"Deploy"**

### Step 3: Configure Custom Domain (Optional)

1. Go to your Vercel project settings
2. Navigate to **"Domains"**
3. Add your custom domain
4. Follow DNS configuration instructions

---

## 🔒 Part 3: Security Configuration

### Update CORS on Backend

Update `backend/src/main.ts`:

```typescript
app.enableCors({
  origin: [
    'https://your-app.vercel.app',
    'https://triverse-erp.vercel.app',
    'http://localhost:5173', // for local development
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

Commit and push changes - Render will auto-redeploy.

---

## ✅ Part 4: Verification

### Test Backend
```bash
curl https://triverse-erp-backend.onrender.com/api/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-04T10:30:00.000Z"
}
```

### Test Frontend
1. Open: `https://your-app.vercel.app`
2. Login with test credentials:
   - Email: `charudatta.warke@triverse.com`
   - Password: `TS2025001@2025`
3. Verify all features work

---

## 🔄 Continuous Deployment

Both platforms support automatic deployments:

### Vercel
- Automatically deploys on push to `main` branch
- Preview deployments for pull requests
- Instant rollback capability

### Render
- Automatically deploys on push to `main` branch
- Manual deploy option available
- Health checks ensure stability

---

## 📊 Monitoring & Logs

### Vercel
- **Dashboard**: View deployment logs and analytics
- **Runtime Logs**: Real-time function logs
- **Analytics**: Page views and performance metrics

### Render
- **Logs Tab**: Real-time application logs
- **Metrics**: CPU, memory, and request metrics
- **Events**: Deployment history and status

---

## 💰 Cost Estimates

### Free Tier Limits

**Vercel (Free)**
- 100 GB bandwidth/month
- Unlimited deployments
- Automatic SSL
- Custom domains (1 team)

**Render (Free)**
- 750 hours/month
- 512 MB RAM
- Automatic SSL
- Auto-sleep after 15 min inactivity

**Render Database (Free)**
- 1 GB storage
- 90-day data retention
- Automatic backups

### Paid Plans (if needed)

**Vercel Pro ($20/month)**
- 1 TB bandwidth
- Advanced analytics
- Team collaboration

**Render Starter ($7/month per service)**
- Always-on (no sleep)
- 512 MB RAM
- Persistent storage

---

## 🚨 Troubleshooting

### Backend Issues

**Database Connection Fails**
```bash
# Check DATABASE_URL format
echo $DATABASE_URL
# Should be: postgresql://user:pass@host:5432/dbname
```

**Prisma Client Issues**
```bash
cd backend
npx prisma generate
npm run build
```

### Frontend Issues

**API Calls Failing**
1. Check CORS settings in backend
2. Verify VITE_API_URL in Vercel environment variables
3. Check browser console for errors

**Build Fails**
```bash
# Test locally first
cd frontend
npm run build
# Fix any TypeScript errors before deploying
```

---

## 📝 Post-Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Database migrations run successfully
- [ ] Frontend deployed and accessible
- [ ] Login functionality works
- [ ] API calls successful (check Network tab)
- [ ] CORS configured correctly
- [ ] Environment variables set properly
- [ ] SSL certificates active (HTTPS)
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring and alerts set up
- [ ] Team notified of new URLs

---

## 🔗 Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Render Dashboard**: https://dashboard.render.com/
- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs

---

## 📞 Support

For deployment issues:
- Vercel: https://vercel.com/support
- Render: https://render.com/docs/support
- Project Issues: https://github.com/Vrajm12/triverse-erp/issues
