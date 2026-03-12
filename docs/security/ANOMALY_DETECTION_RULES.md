# Advanced Anomaly Detection Rules

## 🎯 Purpose
Static thresholds catch **script attacks**. These rules catch **real breaches** by detecting suspicious behavior patterns.

---

## 🚨 Detection Rules (What Gets Caught)

### 1. **Compromised Account Detection** 🔴 CRITICAL
**Pattern:** Login from NEW IP + Data Export within 10 minutes

**Why This Matters:**
- Attacker compromises credentials
- Logs in from new location
- Immediately steals data before victim notices

**SQL Logic:**
```sql
-- Finds users who:
-- 1. Logged in from an IP they NEVER used before (30-day history)
-- 2. Exported data within 10 minutes of that login
```

**Alert Example:**
> 🚨 CRITICAL: User john@company.com logged in from NEW IP 203.45.67.89 and immediately exported 3 dataset(s). Possible account compromise!

**Response:**
1. Force logout this user immediately
2. Reset password
3. Enable 2FA
4. Review exported data - what was stolen?

---

### 2. **Off-Hours Suspicious Activity** ⚠️ HIGH
**Pattern:** Sensitive operations during 2-6 AM

**Why This Matters:**
- Most employees don't work at 3 AM
- Attackers operate when security teams sleep
- Common pattern in ransomware/data theft

**Detects:**
- Data exports at 3 AM
- Password changes at 4 AM
- Role changes at 2 AM

**Alert Example:**
> ⚠️ 2 sensitive operation(s) detected during off-hours (3:00). Unusual for this time.

**Response:**
1. Check who performed the action
2. Verify with employee: "Did you work at 3 AM?"
3. If no: immediate password reset

---

### 3. **Anomalous Data Volume** ⚠️ HIGH
**Pattern:** User exports 5x their historical average

**Why This Matters:**
- User normally exports 2 datasets/day
- Today: 10 exports in 1 hour
- Possible data theft before leaving company

**SQL Logic:**
```sql
-- Calculates each user's 30-day average
-- Alerts if recent activity > 5x average
```

**Alert Example:**
> ⚠️ User sarah@company.com exported 12 datasets in last hour (5x their average of 2.3). Possible data theft.

**Response:**
1. Interview user: "Why the sudden increase?"
2. Check if they resigned recently
3. Review export logs - what did they take?

---

### 4. **Impossible Travel** 🔴 CRITICAL
**Pattern:** Login from IP A, then IP B within 1 hour (different locations)

**Why This Matters:**
- User logs in from New York (IP: 203.x.x.x)
- 10 minutes later: logs in from China (IP: 45.x.x.x)
- **Physically impossible** = one session is attacker

**Severity Levels:**
- **< 5 minutes:** CRITICAL (session hijacking or VPN abuse)
- **< 60 minutes:** MEDIUM (traveling unlikely, monitor)

**Alert Example:**
> 🚨 User mike@company.com logged in from IP 203.45.67.89, then 45.123.45.67 within 3 minutes. Possible session hijacking or VPN abuse.

**Response:**
1. Kill all sessions immediately
2. Contact user: "Are you using VPN?"
3. If no VPN: force password reset

---

### 5. **Credential Stuffing Success** 🔴 CRITICAL
**Pattern:** Multiple failed logins from IP, then SUCCESS

**Why This Matters:**
- Attacker tries 100 passwords (failed)
- Password #101 works (success)
- **Your user's credentials are compromised** (leaked from another breach)

**SQL Logic:**
```sql
-- Finds IPs with ≥3 failed attempts in 5 min
-- That then successfully logged in
```

**Alert Example:**
> 🚨 CRITICAL: IP 45.123.45.67 had 8 failed login attempts, then successfully logged in as user admin@company.com. Possible credential stuffing attack succeeded!

**Response:**
1. **IMMEDIATE:** Force logout + password reset
2. Check: is this password reused from another site?
3. Enable 2FA mandatory
4. Review: what did attacker access?

---

## 📊 Detection Frequency

All rules run **every 5 minutes** via `SecurityMonitorService`:

```
11:00 AM - Check for anomalies → No alerts
11:05 AM - Check for anomalies → No alerts  
11:10 AM - Check for anomalies → 🚨 CRITICAL: New IP + Data Export detected!
          ↓
          Slack alert sent immediately
```

---

## 🎯 What Makes These Rules Effective

### Traditional Rules (Static Thresholds):
```
❌ 10+ failed logins in 5 min → ALERT
```
**Catches:** Brute force scripts  
**Misses:** Attacker who got valid credentials from phishing

### Anomaly Detection (Behavioral):
```
✅ Login from new country + immediate data export → ALERT
✅ User exports 5x normal volume → ALERT
✅ Successful login after failed attempts from same IP → ALERT
```
**Catches:** 
- Compromised accounts
- Insider threats
- Credential stuffing successes
- Data exfiltration attempts

---

## 🔧 Tuning Thresholds

### Current Tunable Values:

| Rule | Threshold | Location | Adjust If... |
|------|-----------|----------|--------------|
| **Compromised Account** | 10 minutes after login | Line 266 | Too many false positives (users often export right after login) |
| **Off-Hours Window** | 2:00 AM - 6:00 AM | Line 323 | Your team works night shifts |
| **Anomalous Volume** | 5x average | Line 380 | Too sensitive (sales team spikes on month-end) |
| **Impossible Travel** | < 60 minutes, < 5 min critical | Line 409 | Global team uses VPNs frequently |
| **Credential Stuffing** | ≥3 failed attempts | Line 449 | Too many alerts from typos |

**To Adjust:**  
Edit [`backend/src/modules/security/security.service.ts`](backend/src/modules/security/security.service.ts)

---

## 🧪 Testing Detection Rules

### Test 1: Compromised Account
```powershell
# 1. Login as user normally
POST /api/v1/auth/login
Body: {"employeeId": "EMP001", "password": "correct"}

# 2. Change your IP (use VPN or different network)

# 3. Login again from new IP
POST /api/v1/auth/login
Body: {"employeeId": "EMP001", "password": "correct"}

# 4. Immediately export data
GET /api/v1/customers/export

# Within 5 minutes → 🚨 Slack alert!
```

### Test 2: Off-Hours Activity
```powershell
# Wait until 2:00-6:00 AM (or change threshold to current hour)
# Export data or change password

# Within 5 minutes → ⚠️ Slack alert!
```

### Test 3: Credential Stuffing Success
```powershell
# Make 4 failed login attempts
for ($i=1; $i -le 4; $i++) {
  Invoke-WebRequest -Uri "http://localhost:3000/api/v1/auth/login" `
    -Method POST -ContentType "application/json" `
    -Body '{"employeeId":"EMP001","password":"wrong"}' `
    -UseBasicParsing
}

# Then login with correct password
Invoke-WebRequest -Uri "http://localhost:3000/api/v1/auth/login" `
  -Method POST -ContentType "application/json" `
  -Body '{"employeeId":"EMP001","password":"correct"}' `
  -UseBasicParsing

# Within 5 minutes → 🚨 Slack alert!
```

---

## 💡 Real-World Scenarios Caught

### Scenario 1: Phished Employee
**What Happened:**
- Employee clicked phishing link → credentials stolen
- Attacker in Romania logs in (employee is in USA)
- Exports customer database immediately

**Detection:**
- ✅ Rule #1: New IP + Quick Export
- ✅ Rule #4: Impossible Travel (USA → Romania in 5 min)

**Outcome:** Account locked within 5 minutes, minimal data loss

---

### Scenario 2: Disgruntled Employee
**What Happened:**
- Employee planning to leave company
- Starts exporting all invoices, customer lists, financial reports
- Normally exports 2 datasets/day, today exported 15

**Detection:**
- ✅ Rule #3: Anomalous Data Volume (7.5x average)

**Outcome:** HR contacted, data export privileges revoked

---

### Scenario 3: Credential Stuffing from Breach
**What Happened:**
- LinkedIn breach exposes user@company.com password
- Attacker tries same password on your ERP
- Works! (user reused password)
- After 3 failed attempts on other accounts, succeeds

**Detection:**
- ✅ Rule #5: Credential Stuffing Success
- ✅ Rule #1: New IP + Suspicious Activity

**Outcome:** Password reset forced, 2FA enabled

---

## 📈 Expected Alert Volume

### Week 1 (Baseline): 
- 2-5 alerts/day (mostly false positives while tuning)
- Common: VPN users triggering Impossible Travel

### After Tuning (Week 2+):
- 0-2 alerts/week (real threats only)
- Each alert is **actionable**

### Critical Alerts Requiring Immediate Action:
- Compromised Account
- Credential Stuffing Success
- Impossible Travel (< 5 min)

**Response Time Target:** < 5 minutes from alert to account lockout

---

## 🔐 Beyond Detection: Prevention

### To Reduce Alert Volume (Make Attacks Harder):

1. **Enable 2FA for all users** → Compromised credentials useless
2. **IP allowlisting for admin panel** → Blocks foreign IPs
3. **Rate limit data exports** → Max 5 exports/hour per user
4. **Mandate unique passwords** → Credential stuffing fails
5. **Session timeout** → 30 min idle = re-login required

---

## 📚 Files Modified

- **Detection Logic:** [`backend/src/modules/security/security.service.ts`](backend/src/modules/security/security.service.ts) (Lines 266-470)
- **Alert Service:** [`backend/src/modules/security/alert-notification.service.ts`](backend/src/modules/security/alert-notification.service.ts)
- **Scheduler:** [`backend/src/modules/security/security-monitor.service.ts`](backend/src/modules/security/security-monitor.service.ts)

---

**🎯 Result:** Your security system now catches **real breaches**, not just script attacks.

**Before:** "10 failed logins detected" (brute force script)  
**After:** "User logged in from China, immediately exported customer database" (actual data theft!)
