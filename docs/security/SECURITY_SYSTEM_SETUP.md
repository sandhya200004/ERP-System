# Security System Setup Guide

## Overview

TriVerse ERP now has a complete **Level 3 Observable Security** system with:

- ✅ Real-time security dashboard
- ✅ Public status page
- ✅ Automated alert detection
- ✅ Slack/Email notifications
- ✅ Scheduled monitoring (every 5 minutes)
- ✅ Daily security reports
- ✅ Backup restoration testing

## Quick Start

### 1. Install Required Dependencies

```bash
cd backend
npm install @nestjs/schedule axios
```

### 2. Configure Environment Variables

Add these to your `backend/.env` file:

```env
# ================================
# Security Alert Configuration
# ================================

# Enable/disable alert channels
ENABLE_SLACK_ALERTS=true
ENABLE_EMAIL_ALERTS=false

# Slack webhook URL (create at https://api.slack.com/messaging/webhooks)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Email configuration (if using email alerts)
ALERT_EMAIL=security@triverse.com
SENDGRID_API_KEY=your_sendgrid_api_key_here

# Database credentials (for backup testing)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=triverse_erp
```

### 3. Set Up Slack Alerts (Recommended)

**Step 1: Create Slack Webhook**

1. Go to https://api.slack.com/messaging/webhooks
2. Click "Create your Slack app"
3. Choose "From scratch"
4. Name your app "TriVerse Security Alerts"
5. Select your workspace
6. Go to "Incoming Webhooks" and activate
7. Click "Add New Webhook to Workspace"
8. Select the channel (e.g., #security-alerts)
9. Copy the webhook URL

**Step 2: Configure .env**

```env
ENABLE_SLACK_ALERTS=true
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

**Step 3: Restart Backend**

```bash
npm run start:dev
```

You'll receive alerts in Slack for:
- 🚨 **Critical**: Brute force attacks (≥10 failed logins in 5 min)
- ⚠️ **High**: Large data exports (>1000 records in 1 hour)
- ⚡ **Medium**: Permission denied spikes (>20 in 5 min)
- ℹ️ **Low**: Daily security summaries

### 4. Access Security Dashboard

**Backend Routes:**
- `GET /security/metrics` - Security metrics (protected)
- `GET /security/alerts` - Active alerts (protected)
- `GET /security/status` - System status (public)

**Frontend Pages:**
- **Dashboard**: http://localhost:3000/admin/security (requires login)
- **Status Page**: http://localhost:3000/status (public)

**Navigation:** Security Dashboard link is in the admin sidebar menu

### 5. Schedule Backup Testing

**PowerShell Script:** `backend/test-backup-restoration.ps1`

**Manual Test:**
```powershell
cd backend
.\test-backup-restoration.ps1
```

**Schedule Monthly (Windows Task Scheduler):**
1. Open Task Scheduler
2. Create Task → General tab:
   - Name: "TriVerse Backup Testing"
   - Run whether user is logged on or not
3. Triggers tab → New:
   - Monthly, first day, 2:00 AM
4. Actions tab → New:
   - Action: Start a program
   - Program: `powershell.exe`
   - Arguments: `-File "N:\PROJECTS\TriVerse ERP\backend\test-backup-restoration.ps1"`
5. Save

**Schedule Monthly (Linux/Mac cron):**
```bash
# Run on 1st day of month at 2am
0 2 1 * * cd /path/to/backend && pwsh test-backup-restoration.ps1
```

## Monitoring Schedule

The system automatically runs:

| Task | Schedule | Purpose |
|------|----------|---------|
| Security alert check | Every 5 minutes | Detect brute force, large exports, permission spikes |
| System uptime log | Every hour | Monitor system health |
| Daily security report | Daily at 8:00 AM | Summary of metrics and status |

**View active schedules:**
```bash
GET http://localhost:3000/security/metrics
# Check logs for "Running scheduled security alert check..."
```

## Architecture

### Backend Services

**1. SecurityService** (`security.service.ts`)
- Collects security metrics from audit logs
- Detects security threats
- Monitors system health

**2. AlertNotificationService** (`alert-notification.service.ts`)
- Sends alerts to Slack/Email
- Formats messages with severity colors
- Handles batch notifications

**3. SecurityMonitorService** (`security-monitor.service.ts`)
- Cron jobs for scheduled checks
- Alert detection every 5 minutes
- Daily security reports

### Frontend Pages

**1. SecurityDashboard** (`frontend/src/pages/admin/SecurityDashboard.tsx`)
- Real-time metrics (30-sec refresh)
- Failed login tracking by IP
- Recent security events
- Active alerts display

**2. StatusPage** (`frontend/src/pages/StatusPage.tsx`)
- Public system status
- Service health indicators
- Uptime statistics

## Testing

### Test Alert Detection

**Trigger brute force alert:**
```bash
# Make 10+ failed login attempts within 5 minutes
for i in {1..10}; do
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"fake@test.com","password":"wrong"}'
done

# Wait up to 5 minutes for scheduled check
# Check Slack or logs for alert
```

**Test large export alert:**
```bash
# Export >1000 records within 1 hour
curl http://localhost:3000/customers/export?limit=1001 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Backup Restoration

```powershell
# Run backup test (creates test DB, restores, validates, cleans up)
.\test-backup-restoration.ps1

# Keep test database for inspection
.\test-backup-restoration.ps1 -CleanupAfter:$false

# Test specific backup file
.\test-backup-restoration.ps1 -BackupFile "backups\triverse_erp_backup_20240101.backup"
```

**Expected output:**
- Log file: `backend/backup-test-reports/backup-test-YYYYMMDD-HHMMSS.log`
- HTML report: `backend/backup-test-reports/backup-test-report-YYYYMMDD-HHMMSS.html`
- Report opens in browser automatically

## Production Deployment

### Environment Setup

**Render.com / Cloud:**
Add these environment variables in your dashboard:
```
ENABLE_SLACK_ALERTS=true
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
DB_HOST=your-postgres-host
DB_PASSWORD=your-secure-password
```

### Docker Deployment

**docker-compose.yml:**
```yaml
services:
  backend:
    environment:
      - ENABLE_SLACK_ALERTS=true
      - SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL}
      - ALERT_EMAIL=security@triverse.com
```

### Kubernetes

**ConfigMap:**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: security-config
data:
  ENABLE_SLACK_ALERTS: "true"
  ALERT_EMAIL: "security@triverse.com"
```

**Secret:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: security-secrets
type: Opaque
data:
  SLACK_WEBHOOK_URL: <base64-encoded-webhook-url>
```

## Troubleshooting

### Alerts not sending to Slack

1. **Check environment variable:**
   ```bash
   echo $ENABLE_SLACK_ALERTS  # Should be "true"
   echo $SLACK_WEBHOOK_URL    # Should start with https://hooks.slack.com
   ```

2. **Test webhook manually:**
   ```bash
   curl -X POST $SLACK_WEBHOOK_URL \
     -H "Content-Type: application/json" \
     -d '{"text":"Test alert from TriVerse ERP"}'
   ```

3. **Check backend logs:**
   ```bash
   # Look for "Alert sent to Slack successfully" or error messages
   npm run start:dev
   ```

4. **Verify scheduled tasks are running:**
   ```bash
   # Should see "Running scheduled security alert check..." every 5 minutes in logs
   ```

### Dashboard not showing data

1. **Check backend is running:**
   ```bash
   curl http://localhost:3000/security/status
   # Should return { "status": "operational", ... }
   ```

2. **Verify authentication:**
   - Login first at http://localhost:3000/login
   - Then navigate to http://localhost:3000/admin/security

3. **Check browser console:**
   - Open DevTools (F12)
   - Look for 401 errors (auth issue) or 500 errors (backend issue)

4. **Verify CASL permissions:**
   - Your role needs `read` permission on `SecurityMetrics` subject
   - Check `backend/src/shared/casl/casl-ability.factory.ts`

### Backup test failing

1. **Check PostgreSQL credentials:**
   ```powershell
   psql -h localhost -U postgres -d triverse_erp
   # Should connect successfully
   ```

2. **Verify backup file exists:**
   ```powershell
   ls backend/backups/*.backup
   ```

3. **Check log file:**
   ```powershell
   cat backend/backup-test-reports/backup-test-*.log
   ```

4. **Test pg_restore manually:**
   ```bash
   pg_restore --version  # Should show PostgreSQL version
   ```

## Security Best Practices

### 1. Protect Webhook URLs
- Never commit webhook URLs to git
- Use environment variables only
- Rotate webhooks if exposed

### 2. Monitor Alert Volume
- Too many alerts = alert fatigue
- Adjust thresholds if needed:
  - Brute force: Currently ≥10 attempts/5min
  - Large exports: Currently >1000 records/hour
  - Permission spikes: Currently >20 denials/5min

### 3. Regular Backup Testing
- Run monthly minimum
- Test different backup ages (yesterday, last week, last month)
- Verify row counts match production

### 4. Alert Response Plan
- Assign on-call rotation
- Document response procedures
- Track incident resolution times

### 5. Dashboard Access Control
- Only security/admin roles should access /admin/security
- Status page (/status) can be public
- Review access logs regularly

## Support

**Documentation:**
- Full security policies: See `SECURITY_*.md` files in root
- API reference: `API_DOCUMENTATION.md`
- Data lifecycle: `DATA_LIFECYCLE_POLICY.md`
- Incident response: `INCIDENT_RESPONSE_PLAN.md`

**Development:**
- Backend code: `backend/src/modules/security/`
- Frontend code: `frontend/src/pages/admin/SecurityDashboard.tsx`, `StatusPage.tsx`
- Tests: `backend/test/security.e2e-spec.ts` (create this)

**Need Help?**
- Check logs: `npm run start:dev` (backend logs)
- Browser console: F12 (frontend errors)
- Database: `psql` (audit_logs table)

---

**You have now achieved Level 3 (Observable) Security Maturity! 🎉**

Next steps for Level 4 (Verified):
- Penetration testing
- Backup restoration drills with team
- Incident response simulations
- Third-party security audit
