# 🚀 Quick Deployment Reference

## URLs After Deployment

### Frontend (Vercel)
```
Production: https://triverse-erp.vercel.app
Preview: https://triverse-erp-[branch].vercel.app
```

### Backend (Render)
```
API Base: https://triverse-erp-backend.onrender.com/api/v1
Health: https://triverse-erp-backend.onrender.com/api/v1/health
Swagger: https://triverse-erp-backend.onrender.com/api/v1/docs
```

---

## Environment Variables

### Vercel (Frontend)
```env
VITE_API_URL=https://triverse-erp-backend.onrender.com/api/v1
```

### Render (Backend)
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/triverse_erp
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
FRONTEND_URL=https://triverse-erp.vercel.app
```

---

## Quick Commands

### Deploy Frontend
```powershell
cd frontend
vercel --prod
```

### Test Backend Locally
```powershell
cd backend
npm install
npx prisma generate
npx prisma db push
npm run start:dev
```

### Run Migrations on Render
```bash
# In Render Shell
npx prisma db push
```

---

## Testing Checklist

- [ ] Backend health check: `curl https://triverse-erp-backend.onrender.com/api/v1/health`
- [ ] Frontend loads: Open `https://triverse-erp.vercel.app`
- [ ] Login works: Test with `charudatta.warke@triverse.com` / `TS2025001@2025`
- [ ] API calls work: Check browser Network tab
- [ ] HTTPS enabled on both domains
- [ ] CORS working (no console errors)

---

## Cost Calculator

### Free Tier (Recommended for Start)
- **Vercel**: Free (100GB bandwidth)
- **Render Web**: Free (750 hours, sleeps after 15min)
- **Render DB**: Free (1GB storage)
- **Total**: $0/month

### Starter Tier (Always-On)
- **Vercel**: Free
- **Render Web**: $7/month (512MB RAM, always-on)
- **Render DB**: $7/month (10GB storage)
- **Total**: $14/month

### Professional Tier
- **Vercel Pro**: $20/month
- **Render Web**: $25/month (2GB RAM)
- **Render DB**: $20/month (50GB storage)
- **Total**: $65/month

---

## Support Links

- **Deployment Guide**: [VERCEL_RENDER_DEPLOYMENT.md](VERCEL_RENDER_DEPLOYMENT.md)
- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Render Dashboard**: https://dashboard.render.com

---

## Troubleshooting

### "API calls failing"
1. Check CORS in backend `src/main.ts`
2. Verify `VITE_API_URL` in Vercel
3. Check Render logs for errors

### "Database connection failed"
1. Verify `DATABASE_URL` format
2. Check database is running on Render
3. Ensure IP whitelist includes Render IPs

### "Frontend shows blank page"
1. Check browser console for errors
2. Verify build succeeded on Vercel
3. Check deployment logs

### "Render service sleeping"
- Free tier sleeps after 15min inactivity
- Upgrade to Starter ($7/month) for always-on
- Or implement keep-alive ping

---

Last Updated: February 4, 2026
