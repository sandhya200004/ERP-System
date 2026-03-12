# TriVerse ERP KPI System - Deployment Guide

## 🚀 Quick Deployment Checklist

This guide walks you through deploying the complete KPI system that was just implemented.

---

## 📋 Prerequisites

- ✅ PostgreSQL 15+ running
- ✅ Node.js 18+ installed
- ✅ Backend & Frontend already set up
- ✅ `.env` file configured with database credentials

---

## 🗄️ Step 1: Run Database Migration

### Option A: Using Prisma (Recommended)

```powershell
# Navigate to backend directory
cd "N:\PROJECTS\TriVerse ERP\backend"

# Apply migration to database
npx prisma db push

# (Optional) Generate Prisma Client if needed
npx prisma generate
```

**What this does:**
- Creates 6 new tables: `employee_kpi_history`, `role_kpi_configs`, `task_audit_logs`, `task_proofs`, `notifications`, `notification_settings`
- Adds 18 new fields to `employee_tasks` table
- Creates 2 database views: `team_hierarchy`, `employee_kpi_summary`
- Adds 12 performance indexes
- Creates 3 auto-timestamp triggers
- Inserts default role KPI configurations

### Option B: Manual SQL Execution

```powershell
# If Prisma doesn't work, run SQL manually
psql -U postgres -d triverse_erp -f "backend/prisma/migrations/20251125_kpi_system_complete/migration.sql"
```

### ✅ Verify Migration Success

```sql
-- Check new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('employee_kpi_history', 'role_kpi_configs', 'task_proofs', 'notifications');

-- Check new columns in employee_tasks
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'employee_tasks' 
AND column_name IN ('complexity', 'estimated_hours', 'actual_hours', 'task_score', 'proofs');

-- Check views exist
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public';
```

**Expected Output:** All tables, columns, and views should exist.

---

## 🔧 Step 2: Restart Backend Server

```powershell
# Navigate to backend
cd "N:\PROJECTS\TriVerse ERP\backend"

# Stop current server (Ctrl+C if running)

# Start in development mode
npm run start:dev

# Or start in production mode
npm run build
npm run start:prod
```

**What this does:**
- Loads 3 new modules: `EmployeeModule`, `KpiModule`, `NotificationModule`
- Registers 16 new API endpoints
- Initializes file upload service
- Connects to enhanced database schema

### ✅ Verify Backend Started

```powershell
# Check server logs for successful startup
# Should see:
# [Nest] INFO [NestFactory] Starting Nest application...
# [Nest] INFO [InstanceLoader] EmployeeModule dependencies initialized
# [Nest] INFO [InstanceLoader] KpiModule dependencies initialized
# [Nest] INFO [InstanceLoader] NotificationModule dependencies initialized
# [Nest] INFO [RoutesResolver] EmployeeController {/employees}
# [Nest] INFO [RoutesResolver] KpiController {/kpi}
# [Nest] INFO [RoutesResolver] NotificationController {/notifications}
```

**Test Backend Health:**
```powershell
# Test employee endpoint
curl http://localhost:3000/employees -H "Authorization: Bearer YOUR_TOKEN"

# Test KPI endpoint (replace with real employee ID)
curl http://localhost:3000/kpi/employee/UUID -H "Authorization: Bearer YOUR_TOKEN"

# Test notifications endpoint
curl http://localhost:3000/notifications -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎨 Step 3: Add Frontend Routes

### Update App Router

**File:** `frontend/src/App.tsx`

Add these routes inside your `<Routes>` component:

```typescript
import EmployeesPage from './pages/EmployeesPage';
import KPIReviewPage from './pages/KPIReviewPage';

// Inside <Routes>
<Route path="/employees" element={<EmployeesPage />} />
<Route path="/kpi-review" element={<KPIReviewPage />} />
```

### Update Sidebar Menu

**File:** `frontend/src/layouts/DashboardLayout.tsx` (or wherever your menu is defined)

Add these menu items:

```typescript
{
  key: 'employees',
  icon: <TeamOutlined />,
  label: 'Employees',
  onClick: () => navigate('/employees'),
},
{
  key: 'kpi-review',
  icon: <TrophyOutlined />,
  label: 'KPI Review',
  onClick: () => navigate('/kpi-review'),
  // Optional: Show only for managers/admins
  // visible: hasPermission(user?.role, 'VIEW_ALL_KPI'),
},
```

---

## 🧪 Step 4: Test Core Features

### Test 1: Employee Management

1. **Navigate to Employees Page** (`/employees`)
2. **Add New Employee:**
   - Click "Add Employee" button
   - Fill form:
     - First Name: "John"
     - Last Name: "Doe"
     - Email: "john.doe@company.com"
     - Designation: "Senior Software Engineer"
     - Department: "Engineering"
     - Role: "DEVELOPER"
     - Manager: Select existing manager
     - Joining Date: Select date
   - Click "Add Employee"
   - ✅ Success: Should see new employee in table

3. **Edit Employee:**
   - Click Edit icon on any employee
   - Change department to "Product"
   - Click "Update"
   - ✅ Success: Department updated in table

4. **View Team:**
   - Find employee with "Manager" role
   - Click "View Team" button
   - ✅ Success: Modal shows list of direct reports

### Test 2: Task Workflow with Proof Upload

1. **Navigate to My KPI Page** (`/my-kpi`)
2. **Create Task:**
   - Click "Add Task" button
   - Fill details:
     - Title: "Implement user authentication"
     - Description: "Add JWT-based auth"
     - Complexity: "complex"
     - Priority: "high"
     - Estimated Hours: 8
     - Category: "Development"
   - Status: "In Progress"
   - Click "Add Task"

3. **Complete Task:**
   - Find task in table
   - Click "Complete" button
   - ✅ Task status changes to "Completed"

4. **Submit Task with Proof:**
   - Find completed task
   - Click "Submit" button
   - **Submit Task Modal opens:**
     - Enter Actual Hours: 7.5
     - Add Notes: "Completed auth implementation with bcrypt"
     - **Upload Proof Files:**
       - Click "Select Files"
       - Choose screenshots/documents (min required based on complexity)
       - See files listed with size
     - Click "Submit for Approval"
   - ✅ Success: Task status changes to "Pending Approval"
   - ✅ Backend: Task marked as `submitted`, proofs saved to `backend/uploads/proofs/`

### Test 3: Manager Task Approval

**Prerequisites:** Login as a manager who has submitted tasks from team members

1. **Navigate to My KPI Page** (`/my-kpi`)
2. **Switch to "Team Tasks" Tab**
3. **Find Submitted Task:**
   - Look for tasks with "Pending Approval" status
   - Click "Review" button

4. **Approve Task:**
   - **Task Approval Modal opens:**
     - Review task details (complexity, estimated vs actual hours)
     - Review employee's notes
     - **View Proof Files:**
       - See list of uploaded proofs
       - Click "Download" to view files
     - **Rate Quality:**
       - Select 1-5 stars (converts to 0-100 score)
       - 5 stars = 100 (Excellent)
       - 4 stars = 80 (Good)
       - 3 stars = 60 (Average)
     - Add Feedback (optional): "Great work on the implementation!"
     - Click "Approve"
   - ✅ Success: Task status changes to "Approved"
   - ✅ Backend: Task score calculated, KPI updated

5. **Reject Task:**
   - Click "Reject" button instead
   - **Reject Modal:**
     - Enter detailed feedback: "Please add unit tests before resubmitting"
     - Click "Reject"
   - ✅ Success: Task returned to employee with feedback
   - ✅ Status: Changes back to "In Progress"

### Test 4: KPI Review Dashboard

1. **Navigate to KPI Review** (`/kpi-review`)
2. **View Dashboard:**
   - ✅ See 4 statistic cards:
     - Team Average KPI
     - Team Members count
     - Total Tasks
     - Completion Rate %
   - ✅ See KPI Trend Line Chart (4 months)
   - ✅ See Team Comparison Column Chart
   - ✅ See Ranking Table with medals (🥇🥈🥉)

3. **Test Filters:**
   - Change date range (e.g., Last Month)
   - Select Department filter (e.g., "Engineering")
   - Select Role filter (e.g., "DEVELOPER")
   - ✅ All charts and table update

4. **Test Sorting:**
   - Click column headers to sort
   - Sort by KPI Score (descending)
   - Sort by Completion % (ascending)

5. **Test Export (Placeholder):**
   - Click "Export" button
   - ✅ Should show placeholder message

### Test 5: Notifications

1. **Trigger Notification:**
   - As employee: Submit a task
   - As manager: Should receive notification

2. **View Notifications:**
   - Click **Notification Bell** icon in header
   - ✅ Badge shows unread count
   - (Currently: Basic stub, needs enhancement with dropdown)

3. **Test Backend API:**
   ```powershell
   # Get notifications
   curl http://localhost:3000/notifications -H "Authorization: Bearer YOUR_TOKEN"
   
   # Get unread count
   curl http://localhost:3000/notifications/unread-count -H "Authorization: Bearer YOUR_TOKEN"
   ```

---

## 📊 Step 5: Verify KPI Calculations

### Test Task Scoring

1. **Create test task with known values:**
   ```json
   {
     "title": "Test Task",
     "complexity": "medium",
     "estimatedHours": 4,
     "actualHours": 4,
     "deadline": "2024-12-01T17:00:00Z",
     "completedAt": "2024-12-01T16:00:00Z"
   }
   ```

2. **Submit and Approve with:**
   - Quality Score: 80 (4 stars)
   - No gaming detected

3. **Check Calculated Score:**
   ```powershell
   # Query database
   SELECT task_score, penalty_pct, quality_score 
   FROM employee_tasks 
   WHERE title = 'Test Task';
   ```

   **Expected:**
   - `task_score`: ~90-95 (excellent performance)
   - `penalty_pct`: 0 (no gaming)
   - Calculation: (Timeliness + Quality + Effort + PeerReview + AutoVerify) × 1.2 (medium complexity)

### Test KPI Aggregation

```powershell
# Call KPI endpoint for employee
curl http://localhost:3000/kpi/employee/EMPLOYEE_UUID?startDate=2024-11-01&endDate=2024-11-30 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "employeeId": "uuid",
  "kpiScore": 87.5,
  "breakdown": {
    "timelinessScore": 90,
    "qualityScore": 85,
    "effortAccuracyScore": 88,
    "peerReviewScore": 0,
    "autoVerificationScore": 0
  },
  "totalTasks": 15,
  "completedTasks": 14,
  "avgTaskScore": 87.5,
  "onTimePercentage": 92.8
}
```

### Test Normalization (Z-Score)

```powershell
# Call team KPI endpoint
curl http://localhost:3000/kpi/team?startDate=2024-11-01&endDate=2024-11-30 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "employees": [
    {
      "employeeName": "John Doe",
      "role": "DEVELOPER",
      "kpiScore": 87.5,
      "normalizedScore": 1.2  // Z-score (above average)
    },
    {
      "employeeName": "Jane Smith",
      "role": "DEVELOPER",
      "kpiScore": 75.0,
      "normalizedScore": -0.5  // Z-score (below average)
    }
  ],
  "roleStats": {
    "DEVELOPER": {
      "mean": 80,
      "stdDev": 8.5,
      "count": 5
    }
  }
}
```

---

## 🔍 Step 6: Data Verification

### Check Database Records

```sql
-- 1. Verify employees created
SELECT emp_id, first_name, last_name, designation, manager_id 
FROM employees 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Verify tasks with proofs
SELECT id, title, complexity, estimated_hours, actual_hours, 
       task_score, penalty_pct, proofs
FROM employee_tasks 
WHERE proofs IS NOT NULL
ORDER BY submitted_at DESC 
LIMIT 5;

-- 3. Verify task proofs uploaded
SELECT tp.id, tp.task_id, tp.file_name, tp.file_path, 
       et.title as task_title
FROM task_proofs tp
JOIN employee_tasks et ON tp.task_id = et.id
ORDER BY tp.uploaded_at DESC 
LIMIT 10;

-- 4. Verify notifications generated
SELECT id, user_id, type, title, message, read, created_at
FROM notifications
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Verify KPI history snapshots
SELECT ekh.id, e.first_name, e.last_name, ekh.kpi_score, 
       ekh.normalized_score, ekh.period_start, ekh.period_end
FROM employee_kpi_history ekh
JOIN employees e ON ekh.employee_id = e.id
ORDER BY ekh.created_at DESC 
LIMIT 5;

-- 6. Check team hierarchy view
SELECT * FROM team_hierarchy WHERE employee_id = 'YOUR_EMPLOYEE_UUID';

-- 7. Check employee KPI summary view
SELECT * FROM employee_kpi_summary LIMIT 5;

-- 8. Verify role configs
SELECT * FROM role_kpi_configs;
```

### Check File System

```powershell
# Verify proof files uploaded
ls "N:\PROJECTS\TriVerse ERP\backend\uploads\proofs"

# Should see files like:
# task-uuid_1732550400000_screenshot.png
# task-uuid_1732550401000_document.pdf
```

---

## 🐛 Troubleshooting

### Issue 1: Migration Fails

**Error:** `relation "employee_tasks" does not exist`

**Solution:**
```powershell
# Run migrations in order
npx prisma migrate deploy

# Or reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

### Issue 2: Backend Doesn't Start

**Error:** `Cannot find module '@nestjs/common'`

**Solution:**
```powershell
# Reinstall dependencies
cd backend
rm -rf node_modules
npm install
```

### Issue 3: Frontend Routes Don't Work

**Error:** 404 Not Found on `/employees`

**Solution:**
- Check `App.tsx` has routes added
- Check menu navigation calls `navigate('/employees')`
- Restart Vite dev server: `npm run dev`

### Issue 4: File Upload Fails

**Error:** `ENOENT: no such file or directory, open 'uploads/proofs/...'`

**Solution:**
```powershell
# Create uploads directory
mkdir "N:\PROJECTS\TriVerse ERP\backend\uploads\proofs" -Force
```

### Issue 5: KPI Score is 0

**Cause:** Task not submitted and approved yet

**Solution:**
1. Ensure task has `estimatedHours`, `actualHours`, `complexity`
2. Submit task with proofs
3. Manager approves with quality score
4. Call recalculate endpoint: `POST /kpi/task/:id/recalculate`

### Issue 6: Notifications Don't Appear

**Cause:** Notification service not called during task workflow

**Solution:**
- Check backend logs for notification creation
- Manually trigger notification:
  ```typescript
  await notificationService.notifyTaskSubmitted(
    taskId, managerId, employeeName, taskTitle, companyId
  );
  ```

---

## 🎯 Next Steps (Enhancements)

### Priority 1: Connect Mock Data to Real API

**KPIReviewPage currently uses mock data. Connect to real API:**

```typescript
// Replace in KPIReviewPage.tsx
import { kpiService } from '../services/kpi.service';

const fetchKPIData = async () => {
  try {
    setLoading(true);
    const [teamData, stats] = await Promise.all([
      kpiService.getTeamKPI(dateRange[0], dateRange[1]),
      kpiService.getDashboardStats(dateRange[0], dateRange[1]),
    ]);

    // Map teamData.employees to teamKPIs state
    setTeamKPIs(teamData.employees.map(emp => ({
      employeeName: emp.employeeName,
      role: emp.role,
      department: emp.department,
      kpiScore: emp.kpiScore,
      normalizedScore: emp.normalizedScore,
      totalTasks: emp.totalTasks,
      completedTasks: emp.completedTasks,
      onTimePercentage: emp.onTimePercentage,
      trend: Math.random() > 0.5 ? 'up' : 'down',  // TODO: Calculate from history
    })));

    // Set statistics
    setStatistics(stats);
  } catch (error) {
    message.error('Failed to fetch KPI data');
  } finally {
    setLoading(false);
  }
};
```

### Priority 2: Enhance NotificationBell

**Add dropdown with notification list:**

```typescript
// NotificationBell.tsx
const [notifications, setNotifications] = useState([]);
const [open, setOpen] = useState(false);

const menu = (
  <Menu>
    {notifications.map(notif => (
      <Menu.Item key={notif.id} onClick={() => handleMarkRead(notif.id)}>
        <Space direction="vertical" size={0}>
          <Text strong>{notif.title}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {notif.message}
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {dayjs(notif.createdAt).fromNow()}
          </Text>
        </Space>
      </Menu.Item>
    ))}
    <Menu.Divider />
    <Menu.Item>
      <Button type="link" onClick={handleMarkAllRead}>Mark all as read</Button>
    </Menu.Item>
  </Menu>
);

return (
  <Dropdown overlay={menu} trigger={['click']} open={open} onOpenChange={setOpen}>
    <Badge count={unreadCount} overflowCount={99}>
      <BellOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
    </Badge>
  </Dropdown>
);
```

### Priority 3: Add Cron Jobs

**Monthly KPI Calculation:**

```typescript
// backend/src/services/cron.service.ts
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CronService {
  constructor(
    private prisma: PrismaService,
    private kpiService: KpiService,
    private notificationService: NotificationService,
  ) {}

  // Run on 1st of every month at 00:00
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async calculateMonthlyKPIs() {
    const lastMonth = dayjs().subtract(1, 'month');
    const periodStart = lastMonth.startOf('month').toISOString();
    const periodEnd = lastMonth.endOf('month').toISOString();

    const employees = await this.prisma.employee.findMany({
      where: { isActive: true },
    });

    for (const employee of employees) {
      await this.kpiService.publishMonthlyKPI(
        employee.id,
        periodStart,
        periodEnd,
      );

      await this.notificationService.notifyKPIPublished(
        employee.userId,
        lastMonth.format('MMMM YYYY'),
        employee.companyId,
      );
    }
  }

  // Run every day at 09:00
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendDeadlineReminders() {
    const tomorrow = dayjs().add(1, 'day').startOf('day').toDate();
    const dayAfter = dayjs().add(2, 'day').startOf('day').toDate();

    const upcomingTasks = await this.prisma.employeeTask.findMany({
      where: {
        deadline: { gte: tomorrow, lt: dayAfter },
        status: { in: ['pending', 'in_progress'] },
      },
      include: { assignedToUser: true },
    });

    for (const task of upcomingTasks) {
      await this.notificationService.notifyDeadlineNear(
        task.id,
        task.assignedTo,
        task.title,
        task.deadline,
        task.assignedToUser.companyId,
      );
    }
  }
}
```

### Priority 4: Add Role-Based Permissions

**Restrict KPI Review to Managers:**

```typescript
// frontend/src/pages/KPIReviewPage.tsx
useEffect(() => {
  if (!hasPermission(user?.role, 'VIEW_ALL_KPI')) {
    message.error('You do not have permission to view this page');
    navigate('/dashboard');
  }
}, [user]);
```

**Backend guard:**

```typescript
// backend/src/modules/kpi/kpi.controller.ts
@UseGuards(RolesGuard)
@Roles('MANAGER', 'HR', 'CEO', 'CTO')
@Get('team')
async getTeamKPI(@Query() query: GetTeamKPIDto) {
  // ...
}
```

---

## 📚 API Reference

### Employee Endpoints

```
POST   /employees                    - Create employee
GET    /employees                    - Get all employees
GET    /employees/:id                - Get employee by ID
GET    /employees/:id/team           - Get direct reports
GET    /employees/:id/hierarchy      - Get full hierarchy
PUT    /employees/:id                - Update employee
DELETE /employees/:id                - Deactivate employee
```

### KPI Endpoints

```
GET    /kpi/employee/:id             - Get employee KPI (with date range)
GET    /kpi/employee/:id/history     - Get KPI history
GET    /kpi/team                     - Get team KPI with normalization
POST   /kpi/task/:id/recalculate     - Recalculate task score
POST   /kpi/employee/:id/publish-monthly - Publish monthly KPI snapshot
```

### Notification Endpoints

```
GET    /notifications                - Get user notifications
GET    /notifications/unread-count   - Get unread count
PATCH  /notifications/:id/read       - Mark as read
POST   /notifications/mark-all-read  - Mark all as read
```

---

## ✅ Success Criteria

Your deployment is successful when:

- ✅ Database migration runs without errors
- ✅ Backend starts with all 3 new modules loaded
- ✅ All 16 new API endpoints respond correctly
- ✅ Employees page shows employee list with search/filters
- ✅ Employee modal creates and edits employees
- ✅ Tasks can be submitted with proof upload
- ✅ Managers can approve/reject tasks with quality scoring
- ✅ KPI Review dashboard shows charts and ranking table
- ✅ Notification bell shows unread count
- ✅ Task scores calculate correctly (0-100 range)
- ✅ KPI aggregates correctly with breakdown scores
- ✅ Z-score normalization works for team comparison
- ✅ Proofs are saved to filesystem and database
- ✅ Audit logs track all task changes

---

## 🎉 Congratulations!

You've successfully deployed the complete TriVerse ERP KPI System with:
- ✅ 6 new database tables + 18 enhanced fields
- ✅ 3 backend modules (Employee, KPI, Notification)
- ✅ 16 new REST API endpoints
- ✅ 5 new frontend pages/components
- ✅ Advanced KPI scoring with gaming detection
- ✅ Z-score normalization for fair comparison
- ✅ Proof upload and evidence management
- ✅ Manager approval workflow
- ✅ Real-time notifications (basic)
- ✅ Interactive dashboards with charts

**Next: Enhance NotificationBell, add cron jobs, connect mock data to real APIs!**

---

**Need Help?** Check troubleshooting section or review code comments in:
- `backend/src/modules/kpi/kpi.service.ts` - Scoring logic
- `backend/src/services/kpiScoreService.ts` - Core calculation engine
- `frontend/src/pages/KPIReviewPage.tsx` - Dashboard implementation
