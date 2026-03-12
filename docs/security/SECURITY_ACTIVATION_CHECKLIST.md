# Security System Activation Checklist

## Quick Start (15 minutes)

### ☐ 1. Install Dependencies (2 min)
```bash
cd backend
npm install
```
**Installs:** @nestjs/schedule, axios

---

### ☐ 2. Configure Slack Alerts (5 min)

**Create Webhook:**
1. Visit: https://api.slack.com/messaging/webhooks
2. Click "Create your Slack app"
3. Choose "From scratch"
4. Name: "TriVerse Security Alerts"
5. Select your workspace
6. Go to "Incoming Webhooks" → Activate
7. Click "Add New Webhook to Workspace"
8. Select channel: `#security-alerts` (create if needed)
9. **Copy webhook URL** (starts with `https://hooks.slack.com/services/...`)

**Example URL:**
```
https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

---

### ☐ 3. Update Environment Variables (2 min)

**Edit `backend/.env`** (or create from `.env.security.example`):

```bash
# Add these lines to your existing .env file:

# Security Alert Configuration
ENABLE_SLACK_ALERTS=true
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Optional: Email alerts (not implemented yet, Slack is enough to start)
ENABLE_EMAIL_ALERTS=false
ALERT_EMAIL=security@triverse.com
```

**⚠️ Important:** Replace `YOUR/WEBHOOK/URL` with your actual Slack webhook URL

---

### ☐ 4. Restart Backend (1 min)
```bash
cd backend
npm run start:dev
```

**Look for these lines in console:**
```
[SecurityMonitorService] Running scheduled security alert check...
[SecurityMonitorService] No security alerts detected
```

**✅ Success indicators:**
- No errors about missing modules
- Scheduled task logs appear every 5 minutes
- No "Failed to send Slack alert" errors

---

### ☐ 5. Test Security Dashboard (3 min)

**Backend API Test:**
```bash
# Test public status endpoint (no auth required)
curl http://localhost:3000/security/status

# Expected response:
{
  "status": "operational",
  "uptime": 12345,
  "services": {
    "database": true,
    "authentication": true
  },
  "lastIncident": null
}
```

**Frontend Test:**
1. Start frontend: `cd frontend && npm run dev`
2. Login: http://localhost:3000/login
3. Navigate: Click "Security Dashboard" in sidebar menu
4. **Verify you see:**
   - System uptime percentage
   - Failed logins (24h) count
   - Active users count
   - Data exports (7d) count
   - Failed login attempts by IP table
   - Recent security events table
   - "Last updated" timestamp (updates every 30 seconds)

**Public Status Page Test:**
1. Open: http://localhost:3000/status (NO login required)
2. **Verify you see:**
   - Operational status badge (green)
   - Service health indicators
   - Uptime percentage
   - System information

---

### ☐ 6. Test Alert Notifications (5 min)

**Option A: Manual Slack Test**
```bash
# Test webhook directly
curl -X POST "YOUR_SLACK_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"text":"🧪 Test alert from TriVerse ERP Security System"}'
```

**Expected:** Message appears in Slack channel immediately

**Option B: Trigger Real Alert (Brute Force Detection)**
```bash
# Make 10+ failed login attempts
for i in {1..10}; do
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"fake@test.com","password":"wrong"}'
done
```

**Expected:**
- Backend logs show: "Found 1 security alerts"
- Within 5 minutes (next cron run), you receive Slack alert:
  - 🚨 **Security Alert: Brute Force Attempt**
  - Severity: CRITICAL
  - Message: "Multiple failed login attempts detected from IP..."

---

## Extended Setup (Optional)

### ☐ 7. Schedule Backup Testing (Monthly)

**Windows Task Scheduler:**
1. Open Task Scheduler
2. Create Task → General:
   - Name: "TriVerse Backup Restoration Test"
   - Run whether user is logged on or not
3. Triggers → New:
   - Monthly
   - First day of month
   - Time: 2:00 AM
4. Actions → New:
   - Action: Start a program
   - Program: `powershell.exe`
   - Arguments: `-File "N:\PROJECTS\TriVerse ERP\backend\test-backup-restoration.ps1"`
5. Save with your Windows password

**Linux/Mac cron:**
```bash
# Edit crontab
crontab -e

# Add this line (runs 1st of month at 2am)
0 2 1 * * cd /path/to/backend && pwsh test-backup-restoration.ps1
```

**Manual Test Now:**
```powershell
cd backend
.\test-backup-restoration.ps1
```

**Expected:**
- Test database created
- Backup restored
- Row counts validated
- HTML report opens in browser
- Test database cleaned up
- ✅ "BACKUP RESTORATION TEST PASSED"

---

### ☐ 8. Production Deployment

**Render.com / Cloud Platform:**
1. Go to your backend service settings
2. Add environment variables:
   ```
   ENABLE_SLACK_ALERTS=true
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
   ```
3. Redeploy backend
4. Check logs for "Running scheduled security alert check..."

**Docker:**
Update `docker-compose.yml`:
```yaml
services:
  backend:
    environment:
      - ENABLE_SLACK_ALERTS=true
      - SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL}
```

Add to `.env`:
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

---

## Verification Checklist

### Backend ✅
- [ ] Dependencies installed (`@nestjs/schedule`, `axios`)
- [ ] Environment variables configured (`.env`)
- [ ] Backend starts without errors
- [ ] Scheduled tasks log every 5 minutes
- [ ] `/security/status` endpoint returns 200 OK
- [ ] `/security/metrics` endpoint returns data (with auth)

### Frontend ✅
- [ ] Security Dashboard accessible at `/admin/security`
- [ ] Dashboard shows real metrics (not zeros)
- [ ] Dashboard auto-refreshes every 30 seconds
- [ ] Status page accessible at `/status` (no auth)
- [ ] Status page shows system health

### Alerts ✅
- [ ] Slack webhook test successful
- [ ] Test alert appears in Slack channel
- [ ] Real alert triggers after 10 failed logins
- [ ] Alert message includes severity and details
- [ ] Daily report received at 8:00 AM (optional: wait 24h)

### Backup Testing ✅
- [ ] Script runs without errors
- [ ] HTML report generated
- [ ] Row counts validated
- [ ] Test passes (all tables match production)
- [ ] Cleanup successful

---

## Troubleshooting

### Issue: "Cannot find module @nestjs/schedule"
**Solution:**
```bash
cd backend
npm install @nestjs/schedule axios
npm run start:dev
```

### Issue: Slack alerts not working
**Check:**
1. `ENABLE_SLACK_ALERTS=true` (not "True" or "TRUE")
2. `SLACK_WEBHOOK_URL` starts with `https://hooks.slack.com/services/`
3. Test webhook manually:
   ```bash
   curl -X POST "$SLACK_WEBHOOK_URL" \
     -H "Content-Type: application/json" \
     -d '{"text":"Test"}'
   ```
4. Check backend logs for errors: "Failed to send Slack alert:"

### Issue: Dashboard shows no data
**Check:**
1. Backend is running and accessible
2. You're logged in (not getting 401 errors)
3. Browser console (F12) for API errors
4. Your role has `read` permission on `SecurityMetrics` subject
5. Database has `audit_logs` table with data

### Issue: Scheduled tasks not running
**Check:**
1. `ScheduleModule` imported in `app.module.ts`
2. Backend logs show "Running scheduled security alert check..." every 5 minutes
3. Restart backend if no scheduled task logs appear

### Issue: Backup test fails
**Check:**
1. PostgreSQL installed and accessible
2. `DB_HOST`, `DB_USER`, `DB_PASSWORD` in `.env`
3. `psql` command available: `psql --version`
4. `pg_restore` command available: `pg_restore --version`
5. Backup file exists in `backend/backups/` directory

---

## Success Criteria

**You know it's working when:**

✅ **Slack channel receives alerts:**
- 🚨 Critical alerts for brute force attempts
- ⚠️ High alerts for large data exports
- ⚡ Medium alerts for permission spikes
- ℹ️ Daily summary reports at 8:00 AM

✅ **Dashboard is live:**
- Real-time metrics update every 30 seconds
- Failed login tracking shows recent IPs
- Security events table populated
- No loading errors

✅ **Status page is public:**
- Accessible without login
- Shows operational status
- Service health indicators green
- Uptime percentage accurate

✅ **Backup testing automated:**
- Monthly test runs successfully
- HTML reports generated
- Email/Slack notification of results
- Data integrity validated

---

## Next Steps After Activation

1. **Monitor for 24 hours:**
   - Check Slack for daily report at 8:00 AM tomorrow
   - Watch for any real security alerts
   - Verify scheduled tasks run every 5 minutes

2. **Adjust alert thresholds if needed:**
   - Edit `backend/src/modules/security/security.service.ts`
   - Change detection thresholds:
     - Brute force: Currently ≥10 attempts/5min
     - Large exports: Currently >1000 records/hour
     - Permission spikes: Currently >20 denials/5min

3. **Add team to Slack channel:**
   - Invite security team to `#security-alerts`
   - Create on-call rotation
   - Document response procedures

4. **Schedule backup tests:**
   - Set up monthly automation
   - Review first test results
   - Document any issues found

5. **Plan Level 4 (Verified):**
   - Research penetration testing firms
   - Budget for security audit ($10k-30k)
   - Schedule incident response drill

---

## Support

**Full Documentation:**
- Setup guide: `SECURITY_SYSTEM_SETUP.md`
- Implementation summary: `LEVEL_3_SECURITY_COMPLETE.md`
- Security policies: `SECURITY_*.md` files

**Quick Help:**
```bash
# Check backend status
curl http://localhost:3000/security/status

# View recent logs
npm run start:dev  # Watch for scheduled task logs

# Test backup script
.\test-backup-restoration.ps1

# Test Slack webhook
curl -X POST "$SLACK_WEBHOOK_URL" -d '{"text":"Test"}'
```

---

**Estimated Time: 15 minutes setup + 5 minutes testing = 20 minutes total**

**You're now at Level 3 (Observable Security)! 🎉🔒**
