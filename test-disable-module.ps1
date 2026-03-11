# PowerShell script to disable modules for a company

# Login as Platform Admin
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/platform-admin/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"veerajmatnale@gmail.com","password":"Veer1201"}'

$token = $loginResponse.access_token
Write-Host "✅ Logged in as Platform Admin" -ForegroundColor Green

# Get Acme Corporation's ID (replace with actual ID after creation)
$companies = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/platform-admin/companies" `
  -Method GET `
  -Headers @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
  }

Write-Host "`n📋 Available Companies:" -ForegroundColor Cyan
$companies.data | ForEach-Object {
    Write-Host "  - $($_.name) (ID: $($_.id), Subdomain: $($_.subdomain))" -ForegroundColor Yellow
}

# Update company to disable inventory module
$companyId = Read-Host "`nEnter Company ID to configure"

$updateData = @{
    settings = @{
        enabled_modules = @{
            sales = $true
            finance = $true
            inventory = $false    # ❌ Disabled
            hr = $true
            procurement = $false  # ❌ Disabled
            reports = $true
            crm = $true
        }
        module_restrictions = @{
            inventory = @{
                disabled_at = (Get-Date -Format "o")
                reason = "Not required for service-based company"
            }
        }
    }
} | ConvertTo-Json -Depth 10

$updateResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/platform-admin/companies/$companyId" `
  -Method PATCH `
  -Headers @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
  } `
  -Body $updateData

Write-Host "`n✅ Company modules configured successfully!" -ForegroundColor Green
Write-Host "`nEnabled Modules:" -ForegroundColor Cyan
$updateResponse.settings.enabled_modules.PSObject.Properties | Where-Object { $_.Value -eq $true } | ForEach-Object {
    Write-Host "  ✓ $($_.Name)" -ForegroundColor Green
}
Write-Host "`nDisabled Modules:" -ForegroundColor Cyan
$updateResponse.settings.enabled_modules.PSObject.Properties | Where-Object { $_.Value -eq $false } | ForEach-Object {
    Write-Host "  ✗ $($_.Name)" -ForegroundColor Red
}
