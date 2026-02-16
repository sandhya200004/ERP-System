# 🔄 TriVerse ERP - Data Lifecycle Management Policy

**Version:** 1.0  
**Effective Date:** February 15, 2026  
**Last Updated:** February 15, 2026  
**Owner:** Chief Technology Officer  
**Classification:** Internal - Confidential

---

## 📋 TABLE OF CONTENTS

1. [Data Retention](#data-retention)
2. [Data Deletion](#data-deletion)
3. [Data Export](#data-export)
4. [Data Recovery](#data-recovery)
5. [Compliance & Legal Holds](#compliance--legal-holds)
6. [Appendices](#appendices)

---

## 📦 DATA RETENTION

### 1.1 Overview

**Purpose:** Define how long different types of data are retained in TriVerse ERP to balance:
- Business operational needs
- Legal and regulatory compliance
- Storage cost optimization
- Customer rights (GDPR, privacy laws)

**Data Classification:**

```
┌─────────────────────────────────────────┐
│  TIER 1: LEGAL & FINANCIAL DATA         │
│  Retention: 7 years                     │
│  - Invoices, receipts, tax records      │
│  - Salary records, employment contracts │
│  - Audit logs, compliance records       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  TIER 2: OPERATIONAL DATA               │
│  Retention: 3 years                     │
│  - Customer records, vendor data        │
│  - Project documentation                │
│  - Purchase orders, inventory records   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  TIER 3: TRANSACTIONAL DATA             │
│  Retention: 1 year                      │
│  - Task assignments, timesheets         │
│  - Activity logs, session data          │
│  - Email notifications sent             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  TIER 4: TEMPORARY DATA                 │
│  Retention: 90 days                     │
│  - Session tokens, cache data           │
│  - Temporary file uploads               │
│  - Draft documents (unsaved)            │
└─────────────────────────────────────────┘
```

### 1.2 Detailed Retention Periods

#### Financial & Accounting Data (7 Years)

**Invoices & Payments:**
- Customer invoices (sent)
- Vendor bills (received)
- Payment records (all methods)
- Credit notes, refunds
- Tax calculations and filings

**Justification:** Tax audit requirements (most jurisdictions: 6-7 years)

**Storage Transition:**
- **Year 0-1:** Hot storage (database, fast access)
- **Year 1-3:** Warm storage (compressed, slower access)
- **Year 3-7:** Cold storage (archive, retrieval on request)

#### Employee & HR Data (7 Years)

**Employment Records:**
- Employee contracts, offer letters
- Salary records, payment history
- Tax documents (W-2, 1099, PAN, etc.)
- Performance reviews
- Resignation/termination records

**Exception - Current Employees:**
- Data retained indefinitely while employed
- 7-year retention starts from termination date

**PII (Personally Identifiable Information):**
- Encrypted storage mandatory
- Access restricted to HR department only
- Right to erasure applies (with legal exceptions)

#### Customer & Vendor Data (3 Years)

**Customer Records:**
- Company information
- Contact details
- Communication history
- Project records

**Retention Exceptions:**
- Active customers: Retained indefinitely
- Customers with outstanding invoices: Until resolved + 7 years
- Data deletion requests: 30 days (unless legal hold)

#### Project & Task Data (3 Years)

**Project Documentation:**
- Project plans and timelines
- Task assignments and completion
- Document uploads
- Comments and discussions

**Archive Strategy:**
- After project completion, mark as archived
- Move to read-only storage after 1 year
- Delete after 3 years (unless part of legal/financial records)

#### System Logs & Audit Trails (1-7 Years)

**Security Audit Logs (7 years):**
- Login/logout events
- Permission changes
- System configuration changes
- Security incidents
- Data access logs (sensitive data)

**Application Logs (1 year):**
- API requests/responses
- Application errors
- Performance metrics
- User activity logs (non-sensitive)

**Diagnostic Logs (90 days):**
- Debug logs
- Development environment logs
- Temporary diagnostic data

#### Backups (30 Days - 7 Years)

**Database Backups:**
- Daily backups: 30 days
- Weekly backups: 1 year
- Monthly backups: 7 years (encrypted, cold storage)

**File Backups:**
- User uploads: 30 days (versioning)
- Long-term: Follows data retention rules above

### 1.3 Automated Retention Management

**Data Lifecycle Automation:**

```sql
-- Automated processes (scheduled jobs)

-- Daily: Archive old session data
DELETE FROM sessions WHERE created_at < NOW() - INTERVAL '90 days';

-- Weekly: Move old logs to cold storage
UPDATE activity_logs 
SET storage_tier = 'cold' 
WHERE created_at < NOW() - INTERVAL '1 year' 
AND storage_tier = 'hot';

-- Monthly: Anonymize deleted user data
UPDATE employees 
SET 
  email = CONCAT('deleted_', id, '@anonymized.local'),
  phone = NULL,
  address = NULL,
  ssn = NULL
WHERE deleted_at IS NOT NULL 
AND deleted_at < NOW() - INTERVAL '30 days';

-- Quarterly: Delete expired temporary files
DELETE FROM temporary_uploads 
WHERE created_at < NOW() - INTERVAL '90 days';

-- Annually: Archive old financial records
-- (Move to cold storage, not deleted due to 7-year requirement)
```

**Notification System:**
- 30 days before deletion: Notify data owner
- 7 days before deletion: Final warning
- At deletion: Confirmation log entry
- Post-deletion: Anonymous metrics only

---

## 🗑️ DATA DELETION

### 2.1 Data Deletion Principles

**Core Principles:**
1. **Right to Erasure:** GDPR Article 17 - users can request deletion
2. **Secure Deletion:** Data must be irrecoverable after deletion
3. **Compliance First:** Legal obligations override deletion requests
4. **Audit Trail:** All deletions logged (who, what, when, why)

**Deletion Methods:**

```
SOFT DELETE (Default):
  - Mark record as deleted (deleted_at timestamp)
  - Keep data for retention period
  - Hide from user views
  - Use for: Most operational data
  
HARD DELETE (Permanent):
  - Physical removal from database
  - Backup overwrite/encryption key destruction
  - Use for: Expired retention data, right to erasure

ANONYMIZATION (GDPR Compliant):
  - Replace PII with anonymous identifiers
  - Keep statistical data
  - Use for: Analytics, compliance reporting
```

### 2.2 Deletion Request Process

#### User-Initiated Deletion ("Right to Erasure")

**Eligible Requests:**
- Personal account data
- Profile information
- Uploaded files (non-business critical)
- Consent withdrawals

**Process:**

```
Step 1: Request Submission
  - User submits deletion request via UI or email
  - System generates ticket number
  - Acknowledgment sent within 24 hours

Step 2: Verification (1-2 business days)
  - Verify user identity (email + security question)
  - Check for legal holds or active contracts
  - Determine scope of deletion
  
Step 3: Legal Review (1-3 business days)
  - Compliance team reviews request
  - Flag data that must be retained (tax, legal)
  - Approve deletion scope
  
Step 4: Execution (within 30 days of request)
  - Soft delete immediate (hide from views)
  - Hard delete after 30-day grace period
  - Delete from backups during next rotation
  
Step 5: Confirmation
  - Email confirmation to user
  - Provide deletion report (what was deleted)
  - Explain retained data (if any) with justification
```

**Deletion Exceptions (Data That Cannot Be Deleted):**
- Financial records within 7-year retention period
- Data subject to legal hold/ongoing litigation
- Data required for regulatory compliance
- Aggregated/anonymized statistical data

#### Administrative Deletion

**Scenarios:**
- Account closure (business closure)
- Data retention period expired
- Compliance violation (spam, abuse)
- System cleanup (orphaned records)

**Approval Requirements:**

| Data Type | Approval Required |
|-----------|-------------------|
| **Employee data** | HR Manager + CTO |
| **Customer data** | Account Manager + CTO |
| **Financial data** | CFO (only after 7 years) |
| **System data** | DevOps Team |

**Execution:**
- Document business justification
- Create deletion ticket with approval trail
- Execute deletion during maintenance window
- Verify deletion completion
- Log to audit trail

### 2.3 Secure Deletion Methods

#### Database Records

**PostgreSQL Secure Deletion:**

```sql
-- Step 1: Soft delete (mark as deleted)
UPDATE employees 
SET deleted_at = NOW() 
WHERE id = 'user_id_to_delete';

-- Step 2: After 30-day grace period, anonymize PII
UPDATE employees 
SET 
  first_name = 'DELETED',
  last_name = 'USER',
  email = CONCAT('deleted_', id, '@anonymized.local'),
  phone = NULL,
  ssn = NULL,
  bank_account = NULL
WHERE deleted_at < NOW() - INTERVAL '30 days';

-- Step 3: After retention period, hard delete
DELETE FROM employees 
WHERE deleted_at < NOW() - INTERVAL '7 years';

-- Step 4: Vacuum to reclaim disk space
VACUUM FULL employees;
```

#### File Storage Deletion

**S3/Azure Blob Storage:**

```bash
# Immediate deletion
aws s3 rm s3://bucket-name/user-files/user_id/ --recursive

# Verify deletion
aws s3 ls s3://bucket-name/user-files/user_id/ 
# (Should return empty)

# For encrypted data: Key destruction = data destruction
# Delete encryption key from KMS
aws kms schedule-key-deletion --key-id <key-id> --pending-window-in-days 7
```

**Versioned Storage:**
- Delete all versions of object
- Delete delete markers
- Verify no version remains

#### Backup Deletion

**Challenge:** Data persists in backups even after database deletion.

**Solution:**
```
Option 1: Wait for backup rotation
  - Daily: 30 days
  - Weekly: 1 year
  - Monthly: 7 years
  - Document deletion in progress

Option 2: Backup overwrite (for urgent deletions)
  - Restore backup to isolated environment
  - Delete data from restored backup
  - Re-compress and encrypt
  - Replace original backup
  - ⚠️ Resource intensive, use only if legally required

Option 3: Encryption key destruction
  - If data encrypted per-user
  - Destroy user's encryption key
  - Data becomes permanently unrecoverable
  - Fastest method for right-to-erasure
```

### 2.4 Deletion Verification

**Post-Deletion Checklist:**

- [ ] Database record deleted/anonymized
- [ ] File storage emptied
- [ ] Cache cleared (Redis, CDN)
- [ ] Search indexes updated (Elasticsearch)
- [ ] Backup deletion scheduled/completed
- [ ] Audit log entry created
- [ ] User notification sent
- [ ] Retention policy compliance verified

**Automated Verification:**

```javascript
// Deletion verification script
async function verifyDeletion(userId) {
  const checks = {
    database: await db.user.findUnique({ where: { id: userId } }),
    files: await s3.listObjects({ Prefix: `users/${userId}/` }),
    cache: await redis.get(`user:${userId}`),
    search: await elasticsearch.search({ query: { term: { user_id: userId } } })
  };
  
  const stillExists = Object.entries(checks)
    .filter(([key, value]) => value !== null && value.length > 0);
  
  if (stillExists.length > 0) {
    throw new Error(`Deletion incomplete: ${JSON.stringify(stillExists)}`);
  }
  
  // Log successful deletion
  await auditLog.create({
    action: 'USER_DELETION_VERIFIED',
    user_id: userId,
    timestamp: new Date(),
    details: 'All data successfully deleted'
  });
}
```

---

## 📤 DATA EXPORT

### 3.1 Data Portability (GDPR Article 20)

**User Rights:**
- Export personal data in machine-readable format
- Transfer data to another service
- Receive data within 30 days of request

**Supported Export Formats:**

```
Primary: JSON (structured, machine-readable)
  - Full data structure preserved
  - Easy for other systems to import
  
Secondary: CSV (tabular data)
  - For spreadsheet import
  - Invoices, payments, tasks
  
Tertiary: PDF (human-readable reports)
  - For printing/archival
  - Formatted reports with company branding
```

### 3.2 Self-Service Export

**User Dashboard Feature:**

```
Settings → Privacy & Data → Export My Data
  
Options:
  ☐ Profile Information
  ☐ Tasks & Projects
  ☐ Timesheets
  ☐ Communication History
  ☐ File Uploads
  
Format: 
  ○ JSON (Complete)
  ○ CSV (Spreadsheet)
  ○ PDF (Report)
  
Email export link when ready (usually < 5 minutes)
```

**Export Contents:**

```json
{
  "export_id": "exp_1234567890",
  "exported_at": "2026-02-15T10:30:00Z",
  "user_id": "emp_001",
  "data": {
    "profile": {
      "name": "Veeraj Matnale",
      "email": "veeraj.matnale@triverse.com",
      "role": "CTO",
      "joined_date": "2024-01-15",
      "department": "Technology"
    },
    "tasks": [
      {
        "id": "task_123",
        "title": "Implement Security Module",
        "status": "completed",
        "created_at": "2026-02-01",
        "completed_at": "2026-02-14"
      }
    ],
    "files": [
      {
        "filename": "document.pdf",
        "size": "2.5MB",
        "uploaded_at": "2026-01-20",
        "download_url": "https://securelink.triverse.com/exports/doc123"
      }
    ]
  }
}
```

### 3.3 Administrative Exports

**Bulk Export Scenarios:**
- Company data migration
- Compliance audit requests
- Business intelligence analysis
- Third-party integrations

**Approval Process:**

```
Request → Department Head Approval → CTO Approval → Execution

Export Types:
  - Employee master list (HR only)
  - Financial records (Finance, Compliance)
  - Customer database (Sales, with restrictions)
  - Audit logs (Security, Compliance, Legal)
```

**Security Measures for Bulk Exports:**
- Export files encrypted (AES-256)
- Password-protected ZIP archives
- Unique password sent via separate channel (SMS/phone)
- Export link expires in 7 days
- Logged to audit trail with justification
- Watermarked (for sensitive documents)

### 3.4 API-Based Export

**Export API Endpoints:**

```javascript
// RESTful API for data export

POST /api/v1/exports
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "export_type": "user_data",
  "user_id": "emp_001",  // Optional: defaults to current user
  "format": "json",      // json | csv | pdf
  "include": ["profile", "tasks", "files"]
}

Response:
{
  "export_id": "exp_1234567890",
  "status": "processing",
  "estimated_completion": "2026-02-15T10:35:00Z",
  "webhook_url": null  // Optional callback
}

// Check export status
GET /api/v1/exports/exp_1234567890

Response:
{
  "export_id": "exp_1234567890",
  "status": "completed",
  "download_url": "https://securelink.triverse.com/exports/exp_1234567890",
  "expires_at": "2026-02-22T10:30:00Z",
  "file_size": "15.2MB"
}
```

**Rate Limiting:**
- User exports: 5 per day
- Admin exports: 20 per day
- Prevents abuse and system overload

### 3.5 Export Security & Privacy

**Data Sanitization:**
- Remove internal IDs and system metadata
- Exclude other users' private data
- Redact sensitive information (based on role)
- No password hashes or security tokens

**Access Control:**
- Users can export only their own data
- Admins require explicit permission for others' data
- Export access logged to audit trail
- CASL permission check: `@CheckAbilities({ action: 'export', subject: 'UserData' })`

**Secure Delivery:**
```
Method 1: Secure Download Link
  - HTTPS only
  - Signed URL with expiration (7 days)
  - One-time download token
  - Deleted after download or expiry

Method 2: Email Attachment
  - Encrypted ZIP file
  - Password sent via SMS
  - Maximum 25MB email size

Method 3: Secure File Transfer
  - SFTP for large exports (> 100MB)
  - Dedicated export directory
  - 24-hour access window
```

---

## 🔧 DATA RECOVERY

### 4.1 Recovery Scenarios

**Scenario Categories:**

```
TIER 1: User Error (95% of cases)
  - Accidental deletion
  - Incorrect data entry
  - File overwrite
  - Recovery Time: < 1 hour
  
TIER 2: Application Bug (3% of cases)
  - Data corruption
  - Failed migration
  - Incorrect bulk update
  - Recovery Time: < 4 hours
  
TIER 3: System Failure (1.5% of cases)
  - Database crash
  - Hardware failure
  - Storage corruption
  - Recovery Time: < 24 hours
  
TIER 4: Disaster (0.5% of cases)
  - Data center outage
  - Ransomware attack
  - Natural disaster
  - Recovery Time: < 72 hours
```

### 4.2 Recovery Options

#### Option 1: Soft Delete Recovery (Fastest)

**For data deleted within 30 days:**

```sql
-- User requests recovery of deleted task
UPDATE tasks 
SET deleted_at = NULL 
WHERE id = 'task_123' 
AND deleted_at > NOW() - INTERVAL '30 days';

-- Log recovery action
INSERT INTO audit_logs (action, user_id, entity_type, entity_id, details)
VALUES ('RECOVER_DELETED_DATA', 'emp_001', 'Task', 'task_123', 'User requested recovery');
```

**Self-Service Recovery UI:**
```
Settings → Deleted Items → Recover
  
Recently Deleted (Last 30 Days):
  ☐ Task: "Fix login bug" (deleted 5 days ago)
  ☐ Document: "Q4_Report.pdf" (deleted 12 days ago)
  
[Recover Selected] [Permanently Delete]
```

#### Option 2: Backup Restoration (Standard)

**For data beyond soft delete period:**

**Process:**
```
Step 1: Identify Backup
  - Determine when data last existed
  - Select appropriate backup (daily/weekly/monthly)
  - Verify backup integrity

Step 2: Isolated Restoration
  - Restore backup to separate database instance
  - DO NOT restore directly to production
  - Prevents overwriting current good data

Step 3: Extract Required Data
  - Query restored database for specific records
  - Export to SQL script or CSV
  - Review data before re-import

Step 4: Selective Import
  - Import extracted data to production
  - Verify data integrity
  - Re-establish relationships (foreign keys)
  - Update timestamps if needed

Step 5: Verification
  - User confirms data recovered correctly
  - Run data validation checks
  - Log recovery to audit trail
```

**Example Recovery Commands:**

```bash
# Step 1: Restore backup to temporary database
pg_restore -h localhost -U postgres -d triverse_erp_restore \
  /backups/daily/triverse_erp_2026-02-10.backup

# Step 2: Extract specific deleted record
psql -d triverse_erp_restore -c \
  "COPY (SELECT * FROM employees WHERE id = 'emp_123') TO STDOUT" \
  > employee_recover.csv

# Step 3: Import to production
psql -d triverse_erp -c \
  "INSERT INTO employees SELECT * FROM recovered_employees WHERE id = 'emp_123'"

# Step 4: Verify
psql -d triverse_erp -c "SELECT * FROM employees WHERE id = 'emp_123'"
```

#### Option 3: Point-in-Time Recovery (PITR)

**For database corruption or ransomware:**

**PostgreSQL PITR:**
```bash
# Restore database to exact timestamp before corruption
pg_restore --recovery-target-time='2026-02-15 09:30:00' \
  --recovery-target-action='promote' \
  /backups/base_backup

# Verify restoration point
psql -c "SELECT pg_last_wal_replay_lsn(), now()"

# Promote to master if verification passes
psql -c "SELECT pg_wal_replay_resume()"
```

**Requirements:**
- Continuous WAL archiving enabled
- Base backup + WAL segments available
- RTO: 2-4 hours (depending on database size)
- RPO: < 15 minutes (last transaction log)

#### Option 4: Disaster Recovery (Failover)

**Complete data center failure:**

```
High-Level DR Process:

Hour 0: Incident Detected
  - Monitoring alerts
  - Automated health checks fail
  - Manual verification

Hour 0-1: Decision to Failover
  - Assess primary site recovery time
  - If > 4 hours, initiate DR
  - CTO approval required

Hour 1-2: Execute Failover
  - Promote secondary database to primary
  - Update DNS to DR site (TTL: 5 minutes)
  - Start application servers in DR region
  - Verify data replication current

Hour 2-3: Verification & Communication
  - Test critical user workflows
  - Notify customers of temporary outage
  - Monitor system stability

Hour 3+: Operations on DR Site
  - Business continues on secondary site
  - Plan primary site restoration
  - Data sync from DR back to primary (when ready)
```

**Automated Failover (RDS Multi-AZ / Azure SQL):**
- Automatic failover in 1-2 minutes
- No data loss (synchronous replication)
- Application reconnects automatically

### 4.3 Recovery Request Process

**User-Initiated Recovery:**

```
Step 1: Submit Request
  - UI: Settings → Support → Data Recovery
  - Email: support@triverse.com with:
    • What data: task_id, document name, date range
    • When deleted: Approximate date/time
    • Business justification
  - Auto-generated ticket number

Step 2: Verification (1-2 hours)
  - Support verifies user identity
  - Checks if data recoverable
  - Estimates recovery time

Step 3: Approval
  - Self-service: Automatic (soft delete recovery)
  - Backup restore: Manager approval required
  - Cost: Free for first 2 recoveries/month, 
         $50 fee thereafter (to prevent abuse)

Step 4: Execution (1-24 hours)
  - Technical team performs recovery
  - User notified when complete
  - Recovery report provided

Step 5: Confirmation
  - User verifies recovered data
  - Close support ticket
```

**SLA for Recovery Requests:**

| Priority | Description | Response Time | Resolution Time |
|----------|-------------|---------------|-----------------|
| **P0 - Critical** | Business-critical data lost, revenue impact | < 30 minutes | < 4 hours |
| **P1 - High** | Important data lost, department impact | < 2 hours | < 24 hours |
| **P2 - Medium** | Individual user data lost | < 8 hours | < 3 days |
| **P3 - Low** | Nice-to-have recovery | < 24 hours | < 7 days |

### 4.4 Recovery Testing

**Quarterly Recovery Drills:**
- **Frequency:** Every 3 months
- **Scenarios:** Random data recovery from backups
- **Participants:** DevOps + IT team
- **Documentation:** Test results logged
- **Improvement:** Update procedures based on findings

**Annual Disaster Recovery Exercise:**
- **Frequency:** Annually
- **Scenario:** Full failover to DR site
- **Participants:** All tech team + executives
- **Duration:** 4-hour simulation
- **Success Criteria:** Application running on DR within RTO

---

## ⚖️ COMPLIANCE & LEGAL HOLDS

### 5.1 Legal Hold Process

**When Data Deletion Must Be Suspended:**
- Active litigation or lawsuit
- Government investigation
- Regulatory audit
- Internal investigation (fraud, misconduct)

**Legal Hold Procedure:**

```
Step 1: Legal Hold Notice
  - Legal/Compliance team issues hold
  - Specifies scope: custodians, date range, keywords
  - Distribution: IT, HR, affected employees

Step 2: System Configuration
  - Flag affected data in database (legal_hold = TRUE)
  - Disable automated deletion jobs for flagged data
  - Prevent user deletion of held data

Step 3: Preservation
  - Export held data to separate secure storage
  - Create forensic copies if needed
  - Document chain of custody

Step 4: Hold Duration
  - Data held until legal matter resolved
  - May be years (beyond normal retention)
  - Cannot be deleted even if user requests

Step 5: Hold Release
  - Legal team issues written release
  - Data returned to normal retention schedule
  - Automated deletion re-enabled
```

**Database Implementation:**

```sql
-- Add legal hold flag to all tables
ALTER TABLE employees ADD COLUMN legal_hold BOOLEAN DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN legal_hold BOOLEAN DEFAULT FALSE;

-- Prevent deletion of held data (trigger)
CREATE OR REPLACE FUNCTION prevent_legal_hold_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.legal_hold = TRUE THEN
    RAISE EXCEPTION 'Cannot delete record under legal hold';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_legal_hold_employees
BEFORE DELETE ON employees
FOR EACH ROW EXECUTE FUNCTION prevent_legal_hold_deletion();
```

### 5.2 Right to Erasure Limitations

**GDPR Article 17 Exceptions (When Deletion Can Be Refused):**

1. **Legal Obligation:** Data required by law (tax records, employment records)
2. **Public Interest:** Data necessary for public health, scientific research
3. **Legal Claims:** Data needed for establishment, exercise, or defense of legal claims
4. **Contractual Necessity:** Data required to fulfill contract
5. **Consent Withdrawal Limitations:** Data obtained with valid consent but needed for other grounds

**Response to Deletion Request with Limitations:**

```
Dear [User],

We have received your request to delete your personal data under GDPR Article 17 
(Right to Erasure).

We have deleted the following data:
✅ Profile photo
✅ Personal contact preferences
✅ Optional demographic information

However, we must retain the following data:
❌ Employment records (including salary history)
❌ Tax documentation (W-2, 1099 forms)
❌ Invoices and financial transactions

Reason for retention:
- Legal obligation under [Jurisdiction] tax law requires 7-year retention
- GDPR Article 17(3)(e) - Legal claims defense

Retention period: Until [Date - 7 years from termination]

After this period, the data will be permanently deleted unless a new legal 
obligation arises.

If you have questions or concerns, please contact our Data Protection Officer 
at privacy@triverse.com.
```

---

## 📋 APPENDICES

### Appendix A: Data Retention Summary Table

| Data Type | Retention Period | Storage Location | Legal Basis |
|-----------|------------------|------------------|-------------|
| **Financial Invoices** | 7 years | Database → Cold Storage | Tax law |
| **Salary Records** | 7 years | Database (encrypted) | Employment law |
| **Tax Documents** | 7 years | Secure file storage | Tax regulations |
| **Audit Logs (Security)** | 7 years | Log archival storage | SOC 2, ISO 27001 |
| **Customer Contracts** | 3 years after expiry | Document storage | Contract law |
| **Employee Contracts** | 7 years after termination | HR system | Labor law |
| **Project Data** | 3 years after completion | Database → Archive | Operational need |
| **Task History** | 1 year | Database | Operational need |
| **Session Logs** | 90 days | Log server | Security monitoring |
| **Temporary Files** | 90 days | Temp storage | None (auto-cleanup) |
| **Email Notifications** | 30 days | Email logs | None (transient) |

### Appendix B: Data Export Checklist

**Pre-Export Verification:**
- [ ] User identity verified
- [ ] Export scope defined
- [ ] Format selected (JSON/CSV/PDF)
- [ ] Approval obtained (if administrative export)
- [ ] No legal hold on data

**Export Execution:**
- [ ] Data extracted from all relevant tables
- [ ] PII sanitized (if third-party export)
- [ ] Files compressed and encrypted
- [ ] Secure download link generated
- [ ] Export logged to audit trail

**Post-Export:**
- [ ] User notified (email with download link)
- [ ] Export file expires after 7 days
- [ ] Delete export file after expiry
- [ ] Monitor for download completion

### Appendix C: Recovery Runbook

**Quick Reference for Common Recoveries:**

```bash
# 1. Recover soft-deleted record (last 30 days)
UPDATE <table> SET deleted_at = NULL WHERE id = '<record_id>';

# 2. Restore single record from backup
pg_restore -a -t <table_name> -d triverse_erp backup.dump
# Then SELECT and re-import specific record

# 3. Point-in-time recovery (last 7 days)
pg_restore --recovery-target-time='YYYY-MM-DD HH:MM:SS' base_backup.dump

# 4. File recovery from S3 versioned bucket
aws s3api list-object-versions --bucket <bucket> --prefix <file_path>
aws s3api get-object --bucket <bucket> --key <file> --version-id <version>

# 5. Check backup availability
ls -lh /backups/daily/  # Local backups
aws s3 ls s3://triverse-backups/  # Cloud backups
```

### Appendix D: Compliance Mapping

**GDPR Requirements:**
- ✅ Article 13/14: Data collection transparency → Privacy policy
- ✅ Article 15: Right of access → Export API
- ✅ Article 16: Right to rectification → Edit profile UI
- ✅ Article 17: Right to erasure → Deletion process (this document)
- ✅ Article 18: Right to restriction → Legal hold process
- ✅ Article 20: Right to portability → JSON/CSV export
- ✅ Article 25: Data protection by design → Encryption, access controls

**SOC 2 Trust Principles:**
- ✅ Availability: Backup and disaster recovery procedures
- ✅ Processing Integrity: Audit logs, data validation
- ✅ Confidentiality: Encryption, access controls
- ✅ Privacy: Data lifecycle management, user rights

---

## 📞 CONTACTS

**Data Protection Officer (DPO):**  
Email: privacy@triverse.com  
Phone: [Redacted]  

**Data Recovery Requests:**  
Email: support@triverse.com  
Subject: "Data Recovery Request - [Ticket#]"

**Legal Hold Inquiries:**  
Email: legal@triverse.com  
(For legal/compliance team only)

---

**Document Control:**  
**Version:** 1.0  
**Approved By:** [CTO Name], Chief Technology Officer  
**Date:** February 15, 2026  
**Next Review:** August 15, 2026  

**Classification:** Internal - Confidential  

---

*This policy applies to all TriVerse ERP systems and data. All employees and contractors must comply.*
