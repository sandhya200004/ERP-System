# Platform Admin Panel Quick Check
$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:3000/api/v1"

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Platform Admin Panel Check" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

try {
    # Login as Platform Admin
    Write-Host "Step 1: Logging in..." -ForegroundColor Yellow
    $loginBody = @{
        email = "veerajmatnale@gmail.com"
        password = "Veer1201"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/platform-admin/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType 'application/json'
    
    $token = $loginResponse.accessToken
    Write-Host "✅ Login Successful!" -ForegroundColor Green
    Write-Host "   Admin: $($loginResponse.admin.first_name) $($loginResponse.admin.last_name)" -ForegroundColor White
    Write-Host "   Email: $($loginResponse.admin.email)`n" -ForegroundColor White
    
    # Get Platform Statistics
    Write-Host "Step 2: Fetching Statistics..." -ForegroundColor Yellow
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $stats = Invoke-RestMethod -Uri "$baseUrl/platform-admin/stats" `
        -Method Get `
        -Headers $headers
    
    Write-Host "📊 Platform Statistics:" -ForegroundColor Cyan
    Write-Host "   Total Companies: $($stats.totalCompanies)" -ForegroundColor White
    Write-Host "   Active: $($stats.activeCompanies) | Trial: $($stats.trialCompanies) | Suspended: $($stats.suspendedCompanies)" -ForegroundColor White
    Write-Host "   Total Users: $($stats.totalUsers)`n" -ForegroundColor White
    
    # Get All Companies
    Write-Host "Step 3: Fetching Companies..." -ForegroundColor Yellow
    $companiesUrl = $baseUrl + '/platform-admin/companies?page=1&limit=10'
    $companies = Invoke-RestMethod -Uri $companiesUrl `
        -Method Get `
        -Headers $headers
    
    Write-Host "🏢 Companies (Page $($companies.page) of $($companies.totalPages)):" -ForegroundColor Cyan
    if ($companies.data.Count -eq 0) {
        Write-Host "   No companies found." -ForegroundColor Yellow
        Write-Host ""
    } else {
        foreach ($company in $companies.data) {
            Write-Host "" 
            Write-Host "   📁 $($company.name)" -ForegroundColor White
            Write-Host "      Subdomain: $($company.subdomain).myerp.com" -ForegroundColor Gray
            Write-Host "      Status: $($company.status) | Plan: $($company.subscription_plan)" -ForegroundColor Gray
            $createdDate = $company.created_at.Substring(0,10)
            Write-Host "      Users: $($company.max_users) | Created: $createdDate" -ForegroundColor Gray
        }
        Write-Host ""
    }
    
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host "Platform Admin Access Token:" -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host $token -ForegroundColor DarkGray
    Write-Host "`nUse this token for API testing with Authorization: Bearer <token>`n" -ForegroundColor Yellow
    
} catch {
    Write-Host "`n❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Details: $($errorJson.message)" -ForegroundColor Yellow
    }
}
