# Subdomain Validation & Testing Guide

## Overview
The platform now includes **real-time subdomain validation** to ensure that company subdomains are valid, available, and properly configured before creation.

## ✅ Subdomain Validation Rules

### 1. Format Requirements
- **Only lowercase letters, numbers, and hyphens** (`a-z`, `0-9`, `-`)
- **Minimum 3 characters**
- **Maximum 63 characters** (DNS limitation)
- **Cannot start or end with a hyphen**

### 2. Reserved Subdomains
The following subdomains are **reserved for system use**:
- `admin`, `www`, `api`, `app`
- `mail`, `ftp`, `localhost`
- `platform`, `system`, `root`
- `help`, `support`, `billing`
- `dashboard`, `portal`, `management`, `console`

### 3. Uniqueness Check
- Subdomain must not be already taken by another company
- System checks against existing companies in the database
- If taken, a suggestion is provided (e.g., `acme123`)

## 🔍 Real-Time Validation Features

### Frontend Validation
When creating a company in the Platform Admin Dashboard:

1. **Type subdomain** in the input field
2. **Automatic validation** after 500ms (debounced)
3. **Visual feedback**:
   - 🔄 **Validating** - Gray spinning icon while checking
   - ✅ **Available** - Green checkmark when subdomain is valid and available
   - ❌ **Unavailable** - Red X with error message

4. **Preview URL** - Shows the actual URL that will be generated
   - Example: `http://acme.localhost:3000` or `https://acme.myerp.com`
   - **Copyable** - Click to copy the full URL

### Backend API Endpoint
```
GET /api/v1/platform-admin/companies/check-subdomain/:subdomain
Authorization: Bearer <platform_admin_token>
```

**Response Format:**
```json
{
  "available": true,
  "valid": true,
  "message": "Subdomain is available!",
  "preview_url": "http://acme.localhost:3000"
}
```

**Error Response (Invalid):**
```json
{
  "available": false,
  "valid": false,
  "message": "Subdomain must contain only lowercase letters, numbers, and hyphens",
  "suggestion": "acme-corp"
}
```

**Error Response (Taken):**
```json
{
  "available": false,
  "valid": true,
  "message": "This subdomain is already taken",
  "suggestion": "acme789"
}
```

## 🧪 How to Test Subdomain Validation

### Method 1: Via Platform Admin Dashboard (Recommended)
1. **Login** to Platform Admin Panel:
   - Navigate to: http://localhost:5173/platform-admin/login
   - Email: `veerajmatnale@gmail.com`
   - Password: `Veer1201`

2. **Click "Create Company"** button

3. **Test different subdomains**:
   
   ✅ **Valid & Available:**
   - Type: `testcompany123`
   - ✅ Green checkmark appears
   - Preview URL shown: `http://testcompany123.localhost:3000`
   
   ❌ **Invalid Format:**
   - Type: `Test Company` (spaces)
   - ❌ Red X: "Only lowercase letters, numbers, and hyphens"
   - Type: `TEST` (uppercase)
   - Auto-converts to lowercase: `test`
   
   ❌ **Reserved:**
   - Type: `admin`
   - ❌ Red X: "This subdomain is reserved for system use"
   
   ❌ **Too Short:**
   - Type: `ab`
   - ❌ Red X: "Subdomain must be at least 3 characters long"
   
   ❌ **Already Taken:**
   - If a subdomain exists, you'll see:
   - ❌ Red X: "This subdomain is already taken. Try: acme456"

### Method 2: Via API (PowerShell)
```powershell
# Login first to get token
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/platform-admin/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"veerajmatnale@gmail.com","password":"Veer1201"}'

$token = $loginResponse.access_token

# Check subdomain availability
$subdomain = "mycompany"
$checkResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/platform-admin/companies/check-subdomain/$subdomain" `
  -Method GET `
  -Headers @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
  }

Write-Host "Available: $($checkResponse.available)" -ForegroundColor $(if($checkResponse.available){"Green"}else{"Red"})
Write-Host "Valid: $($checkResponse.valid)"
Write-Host "Message: $($checkResponse.message)"
if ($checkResponse.preview_url) {
  Write-Host "Preview URL: $($checkResponse.preview_url)" -ForegroundColor Cyan
}
if ($checkResponse.suggestion) {
  Write-Host "Suggestion: $($checkResponse.suggestion)" -ForegroundColor Yellow
}
```

### Method 3: Via Postman/Insomnia
1. **Login** (POST):
   ```
   POST http://localhost:3000/api/v1/platform-admin/login
   Content-Type: application/json
   
   {
     "email": "veerajmatnale@gmail.com",
     "password": "Veer1201"
   }
   ```

2. **Copy access_token** from response

3. **Check subdomain** (GET):
   ```
   GET http://localhost:3000/api/v1/platform-admin/companies/check-subdomain/mycompany
   Authorization: Bearer <your_access_token>
   ```

## 🌐 How Subdomains Work (Multi-Tenant Architecture)

### Development Environment
- **Base URL**: `http://localhost:3000`
- **Company URL**: `http://{subdomain}.localhost:3000`
- Example: `http://acme.localhost:3000`

**Note**: `*.localhost` automatically resolves to `127.0.0.1` in most browsers without hosts file modification.

### Production Environment
- **Base URL**: `https://myerp.com`
- **Company URL**: `https://{subdomain}.myerp.com`
- Example: `https://acme.myerp.com`

**Requirements**:
- Wildcard DNS record: `*.myerp.com → your_server_ip`
- Wildcard SSL certificate: `*.myerp.com`
- Backend configured to identify company from subdomain

## 🔧 Testing Subdomain Routing

### Test if Subdomain is Working:

1. **Create a company** with subdomain `testco`

2. **Get the login URL** from the response:
   ```json
   {
     "message": "Company created successfully",
     "company": { ... },
     "admin": { ... },
     "login_url": "http://testco.localhost:3000"
   }
   ```

3. **Visit the URL** in your browser:
   ```
   http://testco.localhost:3000
   ```

4. **Expected behavior**:
   - Frontend loads normally (Vite should serve on port 5173, proxy to backend)
   - Login page appears
   - Company-specific branding (if configured)
   - Login with the admin credentials created

### Backend Subdomain Detection

The backend should extract the company from the subdomain:

```typescript
// In your auth middleware or guard
const host = request.headers.host; // e.g., "acme.localhost:3000"
const subdomain = host.split('.')[0]; // "acme"

// Find company by subdomain
const company = await prisma.companies.findUnique({
  where: { subdomain }
});

// Attach to request
request.company = company;
```

## 📋 Validation Checklist

Before creating a company, ensure:

- ✅ Subdomain is **3-63 characters**
- ✅ Contains only **lowercase letters, numbers, hyphens**
- ✅ Does **NOT** start or end with hyphen
- ✅ Is **NOT** a reserved word
- ✅ Is **available** (not taken)
- ✅ Preview URL looks correct
- ✅ Green checkmark appears in the form

## 🐛 Troubleshooting

### "Failed to check subdomain availability"
- **Check**: Backend server is running on port 3000
- **Check**: You're logged in (token is valid)
- **Check**: Network connectivity

### "Subdomain already taken" but it shouldn't be
- **Check**: Database for existing company with that subdomain
- **SQL Query**:
  ```sql
  SELECT * FROM companies WHERE subdomain = 'your-subdomain' AND deleted_at IS NULL;
  ```

### Preview URL shows wrong domain
- **Check**: Backend `BASE_URL` environment variable
- **Update**: `.env` file with correct base URL
  ```
  BASE_URL=http://localhost:3000  # Development
  BASE_URL=https://myerp.com      # Production
  ```

### Subdomain doesn't resolve in browser
- **Development**: Use `*.localhost` (works automatically)
- **Production**: Ensure wildcard DNS is configured
  ```
  *.myerp.com  A  your.server.ip
  ```

## 🎯 Next Steps

After validating and creating a subdomain:

1. **Copy the login URL** from the success message
2. **Share with company admin** (the email you specified)
3. **Test login** with the admin credentials
4. **Verify company data isolation** (users can only see their company's data)
5. **Configure company settings** (branding, modules, etc.)

## 📚 Related Documentation

- [PLATFORM_ADMIN_GUIDE.md](./PLATFORM_ADMIN_GUIDE.md) - Full platform admin features
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Multi-tenant architecture details
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Complete API reference

---

**Last Updated**: March 11, 2026
**Version**: 1.0.0
