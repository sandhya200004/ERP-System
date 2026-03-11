# Platform Admin Panel Test Script
$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:3000/api/v1"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Platform Admin Panel Test" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login as Platform Admin
Write-Host "Step 1: Logging in as Platform Admin..." -ForegroundColor Yellow
$loginBody = @{
    email = "veerajmatnale@gmail.com"
    password = "Veer1201"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/platform-admin/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType 'application/json' `
        -ErrorAction Stop
    
    $token = $loginResponse.accessToken
    Write-Host "✅ Login Successful!" -ForegroundColor Green
    Write-Host "Platform Admin: $($loginResponse.admin.first_name) $($loginResponse.admin.last_name)" -ForegroundColor Green
    Write-Host "Email: $($loginResponse.admin.email)" -ForegroundColor Green
    Write-Host ""
    
    # Step 2: Get Platform Statistics
    Write-Host "Step 2: Fetching Platform Statistics..." -ForegroundColor Yellow
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $stats = Invoke-RestMethod -Uri "$baseUrl/platform-admin/stats" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "📊 Platform Statistics:" -ForegroundColor Cyan
    Write-Host "  Total Companies: $($stats.totalCompanies)" -ForegroundColor White
    Write-Host "  Active Companies: $($stats.activeCompanies)" -ForegroundColor Green
    Write-Host "  Trial Companies: $($stats.trialCompanies)" -ForegroundColor Yellow
    Write-Host "  Suspended Companies: $($stats.suspendedCompanies)" -ForegroundColor Red
    Write-Host "  Total Users: $($stats.totalUsers)" -ForegroundColor White
    Write-Host ""
    
    # Step 3: Get All Companies
    Write-Host "Step 3: Fetching All Companies..." -ForegroundColor Yellow
    $companiesUrl = $baseUrl + '/platform-admin/companies?page=1&limit=10'
    $companies = Invoke-RestMethod -Uri $companiesUrl `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "🏢 Companies List:" -ForegroundColor Cyan
    if ($companies.data.Count -eq 0) {
        Write-Host "  No companies found. Create your first company!" -ForegroundColor Yellow
    } else {
        foreach ($company in $companies.data) {
            Write-Host ""
            Write-Host "  Company: $($company.name)" -ForegroundColor White
            Write-Host "  Subdomain: $($company.subdomain)" -ForegroundColor Gray
            $statusColor = 'Yellow'
            if ($company.status -eq 'active') { $statusColor = 'Green' }
            Write-Host "  Status: $($company.status)" -ForegroundColor $statusColor
            Write-Host "  Plan: $($company.subscription_plan)" -ForegroundColor Gray
            Write-Host "  Users: $($company.max_users)" -ForegroundColor Gray
            Write-Host "  Created: $($company.created_at)" -ForegroundColor Gray
        }
    }
    Write-Host ""
    
    # Step 4: Prompt to Create Company
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host "Platform Admin Actions:" -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Would you like to create a new company? (Y/N): " -NoNewline -ForegroundColor Yellow
    $createCompany = Read-Host
    
    if ($createCompany -eq 'Y' -or $createCompany -eq 'y') {
        Write-Host ""
        Write-Host "Enter Company Details:" -ForegroundColor Cyan
        Write-Host "---------------------"
        
        $companyName = Read-Host "Company Name"
        $subdomain = Read-Host "Subdomain (for example: acme for acme.myerp.com)"
        $adminEmail = Read-Host "Admin Email"
        $adminPassword = Read-Host "Admin Password"
        $adminFirstName = Read-Host "Admin First Name"
        $adminLastName = Read-Host "Admin Last Name"
        
        $createBody = @{
            name = $companyName
            subdomain = $subdomain
            admin_email = $adminEmail
            admin_password = $adminPassword
            admin_first_name = $adminFirstName
            admin_last_name = $adminLastName
            subscription_plan = "trial"
            max_users = 10
            max_branches = 5
            max_storage_gb = 10
        } | ConvertTo-Json
        
        Write-Host ""
        Write-Host "Creating company..." -ForegroundColor Yellow
        
        $newCompany = Invoke-RestMethod -Uri "$baseUrl/platform-admin/companies" `
            -Method Post `
            -Headers $headers `
            -Body $createBody `
            -ContentType 'application/json' `
            -ErrorAction Stop
        
        Write-Host ""
        Write-Host "✅ Company Created Successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Company Details:" -ForegroundColor Cyan
        Write-Host "  Name: $($newCompany.company.name)" -ForegroundColor White
        Write-Host "  Subdomain: $($newCompany.company.subdomain)" -ForegroundColor White
        Write-Host "  Access URL: http://$($newCompany.company.subdomain).myerp.com" -ForegroundColor White
        Write-Host ""
        Write-Host "Admin Account:" -ForegroundColor Cyan
        Write-Host "  Name: $($newCompany.admin.first_name) $($newCompany.admin.last_name)" -ForegroundColor White
        Write-Host "  Email: $($newCompany.admin.email)" -ForegroundColor White
        Write-Host "  Employee ID: $($newCompany.employeeProfile.employee_id)" -ForegroundColor White
        Write-Host ""
        Write-Host "📝 Use Employee ID to login to the ERP!" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host "Platform Admin Panel Test Complete!" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Access Token (for API testing):" -ForegroundColor Gray
    Write-Host $token -ForegroundColor DarkGray
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
