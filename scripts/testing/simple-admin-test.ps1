# Simple Platform Admin Login Test
$baseUrl = "http://localhost:3000/api/v1"

Write-Host ""
Write-Host "Platform Admin Login Test" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

$loginBody = '{"email":"veerajmatnale@gmail.com","password":"Veer1201"}'

try {
    Write-Host "Logging in..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Uri "$baseUrl/platform-admin/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType 'application/json'
    
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Admin Name: $($response.admin.first_name) $($response.admin.last_name)" -ForegroundColor White
    Write-Host "Email: $($response.admin.email)" -ForegroundColor White
    Write-Host "Super Admin: $($response.admin.is_super_admin)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Full Response:" -ForegroundColor Gray
    $response | ConvertTo-Json -Depth 3
    Write-Host ""
    
    $token = $response.access_token
    Write-Host "Access Token: $token" -ForegroundColor Yellow
    Write-Host ""
    
    $headers = @{
        'Authorization' = "Bearer $token"
        'Content-Type' = 'application/json'
    }
    
    Write-Host "Fetching platform statistics..." -ForegroundColor Yellow
    $stats = Invoke-RestMethod -Uri "$baseUrl/platform-admin/stats" -Method Get -Headers $headers
    
    Write-Host ""
    Write-Host "Platform Statistics:" -ForegroundColor Cyan
    Write-Host "  Total Companies: $($stats.totalCompanies)" -ForegroundColor White
    Write-Host "  Active Companies: $($stats.activeCompanies)" -ForegroundColor White
    Write-Host "  Trial Companies: $($stats.trialCompanies)" -ForegroundColor White
    Write-Host "  Total Users: $($stats.totalUsers)" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}
