# Platform Admin Panel Dashboard
$baseUrl = "http://localhost:3000/api/v1"

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  PLATFORM ADMIN PANEL" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$loginBody = '{"email":"veerajmatnale@gmail.com","password":"Veer1201"}'

try {
    Write-Host "[1/3] Logging in..." -ForegroundColor Yellow
    $auth = Invoke-RestMethod -Uri "$baseUrl/platform-admin/login" -Method Post -Body $loginBody -ContentType 'application/json'
    
    Write-Host "[OK] Logged in as: $($auth.admin.first_name) $($auth.admin.last_name)" -ForegroundColor Green
    Write-Host "      Super Admin: $($auth.admin.is_super_admin)" -ForegroundColor Gray
    Write-Host ""
    
    $token = $auth.access_token
    $headers = @{ 'Authorization' = "Bearer $token"; 'Content-Type' = 'application/json' }
    
    Write-Host "[2/3] Fetching statistics..." -ForegroundColor Yellow
    $stats = Invoke-RestMethod -Uri "$baseUrl/platform-admin/stats" -Method Get -Headers $headers
    
    Write-Host "[OK] Platform Statistics:" -ForegroundColor Green
    Write-Host "      Total Companies: $($stats.totalCompanies)" -ForegroundColor White
    Write-Host "      Active: $($stats.activeCompanies)  |  Trial: $($stats.trialCompanies)  |  Suspended: $($stats.suspendedCompanies)" -ForegroundColor Gray
    Write-Host "      Total Users: $($stats.totalUsers)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "[3/3] Loading companies..." -ForegroundColor Yellow
    $companiesUrl = $baseUrl + '/platform-admin/companies?page=1&limit=10'
    $companies = Invoke-RestMethod -Uri $companiesUrl -Method Get -Headers $headers
    
    Write-Host "[OK] Companies: $($companies.data.Count) found" -ForegroundColor Green
    Write-Host ""
    
    if ($companies.data.Count -gt 0) {
        Write-Host "Company List:" -ForegroundColor Cyan
        Write-Host "-------------" -ForegroundColor Cyan
        foreach ($c in $companies.data) {
            Write-Host "  - $($c.name) ($($c.subdomain).myerp.com)" -ForegroundColor White
            Write-Host "    Status: $($c.status) | Plan: $($c.subscription_plan)" -ForegroundColor Gray
        }
    } else {
        Write-Host "No companies yet. You can create one using:" -ForegroundColor Yellow
        Write-Host "  POST /api/v1/platform-admin/companies" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "Available Platform Admin APIs:" -ForegroundColor White
    Write-Host ""
    Write-Host "Authentication:" -ForegroundColor DarkCyan
    Write-Host "  POST /platform-admin/login" -ForegroundColor Gray
    Write-Host "  POST /platform-admin/register" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Company Management:" -ForegroundColor DarkCyan
    Write-Host "  POST   /platform-admin/companies" -ForegroundColor Gray
    Write-Host "  GET    /platform-admin/companies" -ForegroundColor Gray
    Write-Host "  GET    /platform-admin/companies/:id" -ForegroundColor Gray
    Write-Host "  PATCH  /platform-admin/companies/:id" -ForegroundColor Gray
    Write-Host "  POST   /platform-admin/companies/:id/suspend" -ForegroundColor Gray
    Write-Host "  POST   /platform-admin/companies/:id/reactivate" -ForegroundColor Gray
    Write-Host "  DELETE /platform-admin/companies/:id" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Statistics:" -ForegroundColor DarkCyan
    Write-Host "  GET /platform-admin/stats" -ForegroundColor Gray
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
}
