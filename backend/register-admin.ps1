$body = @{
    email = "veerajmatnale@gmail.com"
    password = "Veer1201"
    first_name = "Veeraj"
    last_name = "Matnale"
    phone = "+919876543210"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/platform-admin/register' -Method Post -Body $body -ContentType 'application/json' -ErrorAction Stop
    Write-Host "✅ Platform Admin Created Successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Account Details:" -ForegroundColor Cyan
    Write-Host "----------------"
    $response | ConvertTo-Json -Depth 10
} catch {
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
