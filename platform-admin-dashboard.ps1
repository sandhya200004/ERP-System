# Platform Admin Panel - Full Demo
$baseUrl = "http://localhost:3000/api/v1"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   TRIVERSE ERP - PLATFORM ADMIN PANEL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$loginBody = '{"email":"veerajmatnale@gmail.com","password":"Veer1201"}'

try {
    # Step 1: Login
    Write-Host "[1/3] Authenticating..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "$baseUrl/platform-admin/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType 'application/json'
    
    Write-Host "✓ Logged in as: $($response.admin.first_name) $($response.admin.last_name)" -ForegroundColor Green
    Write-Host "  Email: $($response.admin.email)" -ForegroundColor Gray
    Write-Host "  Super Admin: $($response.admin.is_super_admin)" -ForegroundColor Gray
    Write-Host ""
    
    $token = $response.access_token
    $headers = @{
        'Authorization' = "Bearer $token"
        'Content-Type' = 'application/json'
    }
    
    # Step 2: Platform Statistics
    Write-Host "[2/3] Loading Platform Statistics..." -ForegroundColor Yellow
    $stats = Invoke-RestMethod -Uri "$baseUrl/platform-admin/stats" -Method Get -Headers $headers
    
    Write-Host "✓ Platform Overview:" -ForegroundColor Green
    Write-Host "  ├─ Total Companies: " -NoNewline -ForegroundColor Gray
    Write-Host "$($stats.totalCompanies)" -ForegroundColor White
    Write-Host "  ├─ Active Companies: " -NoNewline -ForegroundColor Gray
    Write-Host "$($stats.activeCompanies)" -ForegroundColor Green
    Write-Host "  ├─ Trial Companies: " -NoNewline -ForegroundColor Gray
    Write-Host "$($stats.trialCompanies)" -ForegroundColor Yellow
    Write-Host "  ├─ Suspended Companies: " -NoNewline -ForegroundColor Gray
    Write-Host "$($stats.suspendedCompanies)" -ForegroundColor Red
    Write-Host "  └─ Total Users: " -NoNewline -ForegroundColor Gray
    Write-Host "$($stats.totalUsers)" -ForegroundColor White
    Write-Host ""
    
    # Step 3: Companies List
    Write-Host "[3/3] Loading Companies..." -ForegroundColor Yellow
    $companiesUrl = $baseUrl + '/platform-admin/companies?page=1&limit=10'
    $companies = Invoke-RestMethod -Uri $companiesUrl -Method Get -Headers $headers
    
    if ($companies.data.Count -eq 0) {
        Write-Host "✓ No companies yet" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
        Write-Host "   READY TO CREATE YOUR FIRST COMPANY!" -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "Available Platform Admin APIs:" -ForegroundColor White
        Write-Host ""
        Write-Host "  Authentication:" -ForegroundColor DarkCyan
        Write-Host "    • POST /platform-admin/login" -ForegroundColor Gray
        Write-Host "    • POST /platform-admin/register" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  Company Management:" -ForegroundColor DarkCyan
        Write-Host "    • POST   /platform-admin/companies          (Create company)" -ForegroundColor Gray
        Write-Host "    • GET    /platform-admin/companies          (List all)" -ForegroundColor Gray
        Write-Host "    • GET    /platform-admin/companies/:id      (Get details)" -ForegroundColor Gray
        Write-Host "    • PATCH  /platform-admin/companies/:id      (Update)" -ForegroundColor Gray
        Write-Host "    • POST   /platform-admin/companies/:id/suspend" -ForegroundColor Gray
        Write-Host "    • POST   /platform-admin/companies/:id/reactivate" -ForegroundColor Gray
        Write-Host "    • DELETE /platform-admin/companies/:id      (Soft delete)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  Statistics:" -ForegroundColor DarkCyan
        Write-Host "    • GET    /platform-admin/stats              (Platform overview)" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "✓ Found $($companies.data.Count) companies (Page $($companies.page)/$($companies.totalPages))" -ForegroundColor Green
        Write-Host ""
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
        Write-Host "           ACTIVE COMPANIES" -ForegroundColor Cyan
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
        
        foreach ($company in $companies.data) {
            Write-Host ""
            Write-Host "  🏢 $($company.name)" -ForegroundColor White
            Write-Host "     ├─ Subdomain: " -NoNewline -ForegroundColor Gray
            Write-Host "$($company.subdomain).myerp.com" -ForegroundColor Cyan
            
            $statusColor = 'Yellow'
            $statusIcon = '[!]'
            if ($company.status -eq 'active') { 
                $statusColor = 'Green'
                $statusIcon = '[OK]'
            } elseif ($company.status -eq 'suspended') {
                $statusColor = 'Red'
                $statusIcon = '[X]'
            }
            
            Write-Host "     ├─ Status: " -NoNewline -ForegroundColor Gray
            Write-Host "$statusIcon $($company.status)" -ForegroundColor $statusColor
            Write-Host "     ├─ Plan: $($company.subscription_plan)" -ForegroundColor Gray
            Write-Host "     ├─ Users: $($company.max_users) max" -ForegroundColor Gray
            Write-Host "     └─ Created: $($company.created_at.Substring(0,10))" -ForegroundColor DarkGray
        }
        Write-Host ""
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "     Platform Admin Session Active" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Access Token (valid for 12 hours):" -ForegroundColor DarkGray
    Write-Host $token.Substring(0,50) -NoNewline -ForegroundColor DarkGray
    Write-Host "..." -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "Use this token in Authorization header:" -ForegroundColor Yellow
    Write-Host "  Authorization: Bearer <token>" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ ERROR" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Yellow
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    }
    Write-Host ""
}
