# Platform Admin Panel - Access Guide

## Overview
The Platform Admin Panel is a SaaS management interface for managing multiple companies (tenants) in the TriVerse ERP system.

## Accessing the Platform Admin Panel

### Web Interface
1. **From the main login page:**
   - Open http://localhost:5173
   - Click on "🔐 Platform Admin Access →" at the bottom of the login form
   
2. **Direct access:**
   - Navigate to: http://localhost:5173/platform-admin/login

### Login Credentials
```
Email: veerajmatnale@gmail.com
Password: Veer1201
```

## Features

### Dashboard
- **Platform Statistics:**
  - Total Companies
  - Active Companies
  - Trial Companies
  - Suspended Companies
  - Total Users

- **Company Management:**
  - View all companies
  - Create new companies
  - Suspend/Reactivate companies
  - Delete companies
  - View company details

### Creating a New Company

1. Click **"Create Company"** button
2. Fill in the form:
   - **Company Details:**
     - Company Name (e.g., "Acme Corporation")
     - Subdomain (e.g., "acme" for acme.myerp.com)
   
   - **Administrator Account:**
     - First Name
     - Last Name
     - Email
     - Password (minimum 8 characters)
   
   - **Subscription Details:**
     - Plan: Trial, Basic, Professional, or Enterprise
     - Max Users: Default 10
     - Max Branches: Default 5
     - Storage (GB): Default 10

3. Click **"Create Company"**
4. The system will create:
   - Company record
   - Administrator user account
   - Employee profile for the admin
   - Database isolation with company_id

### Company Actions

**Suspend Company:**
- Click "Suspend" button on any active company
- Enter suspension reason
- Company status changes to "suspended"

**Reactivate Company:**
- Click "Reactivate" button on any suspended company
- Company status changes back to "active"

**Delete Company:**
- Click "Delete" button
- Confirm deletion
- Company is soft-deleted (can be recovered from database)

## API Endpoints

Platform Admin APIs are available at `/api/v1/platform-admin`:

### Authentication
- `POST /platform-admin/login` - Platform admin login
- `POST /platform-admin/register` - Register new platform admin

### Company Management
- `POST /platform-admin/companies` - Create company
- `GET /platform-admin/companies` - List all companies
- `GET /platform-admin/companies/:id` - Get company details
- `PATCH /platform-admin/companies/:id` - Update company
- `POST /platform-admin/companies/:id/suspend` - Suspend company
- `POST /platform-admin/companies/:id/reactivate` - Reactivate company
- `DELETE /platform-admin/companies/:id` - Delete company

### Statistics
- `GET /platform-admin/stats` - Platform statistics

## Testing via PowerShell

You can also test the platform admin APIs using the provided script:

```powershell
cd "N:\PROJECTS\TriVerse ERP"
.\admin-panel.ps1
```

This will show:
- Login status
- Platform statistics
- List of companies
- Available API endpoints

## Multi-Tenant Architecture

When you create a company:
1. A new subdomain is assigned (e.g., `acme.myerp.com`)
2. All data is isolated by `company_id`
3. Users can only access their company's data
4. Platform admins can manage all companies

## Security Notes

- Platform admin access is separate from regular ERP access
- JWT tokens are required for all API calls (except login)
- Tokens expire after 12 hours
- All actions are logged in the audit trail
- Rate limiting is active (100 requests/minute for platform admin)

## Troubleshooting

**Cannot access platform admin panel:**
- Ensure backend is running: `cd backend && npm run start:dev`
- Ensure frontend is running: `cd frontend && npm run dev`
- Check browser console for errors
- Verify credentials are correct

**403 Forbidden errors:**
- Token may have expired - login again
- User may not have platform admin privileges
- Check that you're using the correct endpoint

**404 Not Found:**
- Ensure you're using POST for login (not GET)
- Check that API URL is correct: `http://localhost:3000/api/v1`
- Verify routes are registered in backend logs

## Next Steps

1. **Create your first company** using the web interface
2. **Test subdomain routing** (requires DNS configuration for production)
3. **Invite users** to the created company
4. **Monitor platform statistics** as usage grows

---

For more information, see:
- `ARCHITECTURE.md` - Multi-tenant architecture details
- `API_DOCUMENTATION.md` - Complete API reference
- `DEPLOYMENT_GUIDE.md` - Production deployment steps
