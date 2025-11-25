# KPI System API Reference

Quick reference for the new KPI system endpoints.

## 👥 Employee Endpoints

```
POST   /employees                    Create employee
GET    /employees                    Get all employees
GET    /employees/:id                Get employee details
GET    /employees/:id/team           Get direct reports
GET    /employees/:id/hierarchy      Get org hierarchy
PUT    /employees/:id                Update employee
DELETE /employees/:id                Deactivate employee
```

## 📊 KPI Endpoints

```
GET    /kpi/employee/:id             Get employee KPI (requires startDate, endDate params)
GET    /kpi/employee/:id/history     Get KPI history snapshots
GET    /kpi/team                     Get team KPI with Z-score normalization
POST   /kpi/task/:id/recalculate     Recalculate task score
POST   /kpi/employee/:id/publish-monthly  Publish monthly KPI snapshot
```

## 🔔 Notification Endpoints

```
GET    /notifications                Get user notifications (supports ?unreadOnly=true)
GET    /notifications/unread-count   Get unread count
PATCH  /notifications/:id/read       Mark notification as read
POST   /notifications/mark-all-read  Mark all as read
```

## 📋 Enhanced Task Endpoints

```
POST   /employee-tasks/:id/submit    Submit task with proof files (multipart/form-data)
POST   /employee-tasks/:id/approve   Approve/reject task with quality score
POST   /employee-tasks/:id/peer-review  Add peer review
```

## 🔐 Authentication

All endpoints require JWT token:
```
Authorization: Bearer <token>
```

## 📊 KPI Scoring

**Task Score Formula:**
```
BaseScore = (Timeliness×0.25 + Quality×0.35 + Effort×0.15 + Peer×0.15 + Auto×0.10)
FinalScore = BaseScore × ComplexityMultiplier - GamingPenalty×100
```

**Complexity Multipliers:**
- trivial: 0.8x
- small: 1.0x
- medium: 1.2x
- complex: 1.4x
- critical: 1.6x

**Z-Score Normalization:**
```
ZScore = (EmployeeKPI - RoleMean) / RoleStdDev
```

## 🔥 Quick Examples

**Get Employee KPI:**
```bash
curl "http://localhost:3000/kpi/employee/UUID?startDate=2024-11-01&endDate=2024-11-30" \
  -H "Authorization: Bearer TOKEN"
```

**Submit Task with Proof:**
```bash
curl -X POST "http://localhost:3000/employee-tasks/UUID/submit" \
  -H "Authorization: Bearer TOKEN" \
  -F "actualHours=7.5" \
  -F "notes=Completed" \
  -F "proofs=@file.png"
```

**Approve Task:**
```bash
curl -X POST "http://localhost:3000/employee-tasks/UUID/approve" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"approved":true,"qualityScore":85,"feedback":"Great work!"}'
```

**Get Team KPI:**
```bash
curl "http://localhost:3000/kpi/team?startDate=2024-11-01&endDate=2024-11-30" \
  -H "Authorization: Bearer TOKEN"
```

---

**For detailed documentation, see [Full API Documentation](./API_DOCUMENTATION.md)**
