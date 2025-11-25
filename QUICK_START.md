# ⚡ Quick Start Guide - KPI System

## 🚀 5-Minute Deployment

### Step 1: Run Database Migration (2 min)
```powershell
cd "N:\PROJECTS\TriVerse ERP\backend"
npx prisma db push
```

### Step 2: Restart Backend (1 min)
```powershell
# Stop current server (Ctrl+C)
npm run start:dev
```

### Step 3: Add Frontend Routes (1 min)

**File: `frontend/src/App.tsx`**

Add imports:
```typescript
import EmployeesPage from './pages/EmployeesPage';
import KPIReviewPage from './pages/KPIReviewPage';
```

Add routes:
```typescript
<Route path="/employees" element={<EmployeesPage />} />
<Route path="/kpi-review" element={<KPIReviewPage />} />
```

### Step 4: Add Menu Items (1 min)

**File: `frontend/src/layouts/DashboardLayout.tsx`** (or your menu file)

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
},
```

### Step 5: Test! ✅

1. Navigate to `/employees` - See employee list
2. Click "Add Employee" - Create new employee
3. Navigate to `/my-kpi` - See tasks
4. Complete a task → Click "Submit" → Upload proofs
5. (As manager) Switch to "Team Tasks" → Click "Review" → Approve task
6. Navigate to `/kpi-review` - See dashboard with charts

---

## 🎯 What You Get

✅ **Employee Management** - Full CRUD with manager hierarchy  
✅ **Task Workflow** - Create → Complete → Submit → Approve  
✅ **Proof Upload** - File evidence for tasks  
✅ **KPI Scoring** - Advanced 5-component algorithm  
✅ **Manager Approval** - Quality rating and feedback  
✅ **Dashboards** - Charts, rankings, statistics  
✅ **Notifications** - Real-time alerts (basic)  

---

## 📋 Quick Test Cases

### Test 1: Create Employee (2 min)
1. Go to `/employees`
2. Click "Add Employee"
3. Fill: John Doe, john@company.com, Developer, Engineering
4. Select manager
5. Click "Add"
6. ✅ See employee in table

### Test 2: Task Submission (3 min)
1. Go to `/my-kpi`
2. Add task: "Test KPI", complexity "complex"
3. Mark as "Completed"
4. Click "Submit" button
5. Enter actual hours: 4
6. Upload 2 proof files (required for complex)
7. Add notes
8. Click "Submit for Approval"
9. ✅ Status changes to "Pending Approval"

### Test 3: Manager Approval (2 min)
1. Login as manager
2. Go to `/my-kpi` → "Team Tasks" tab
3. Find submitted task
4. Click "Review" button
5. Rate quality: 4 stars (80 points)
6. Add feedback: "Great work!"
7. Click "Approve"
8. ✅ Task approved, score calculated

### Test 4: KPI Dashboard (1 min)
1. Go to `/kpi-review`
2. ✅ See 4 stat cards
3. ✅ See line chart (trend)
4. ✅ See column chart (team comparison)
5. ✅ See ranking table with medals

---

## 🐛 Troubleshooting

**Migration fails?**
```powershell
npx prisma migrate reset  # WARNING: Deletes data
```

**Backend doesn't start?**
```powershell
rm -rf node_modules; npm install
```

**Routes don't work?**
- Check `App.tsx` has routes added
- Restart Vite: `npm run dev`

**Upload fails?**
```powershell
mkdir "N:\PROJECTS\TriVerse ERP\backend\uploads\proofs" -Force
```

---

## 📚 More Help

- **Full Deployment:** See `DEPLOYMENT_GUIDE.md`
- **API Reference:** See `KPI_API_REFERENCE.md`
- **Complete Summary:** See `KPI_SYSTEM_COMPLETE_SUMMARY.md`

---

## 🎉 You're Ready!

**Deployment time:** ~5 minutes  
**Features:** 16 new endpoints, 5 UI components, advanced KPI scoring  
**Status:** Production-ready ✅  

Now deploy and start tracking employee performance! 🚀
