$ErrorActionPreference = "Continue"

$body = @{
    email = "veerajmatnale@gmail.com"
    password = "Veer1201"
    first_name = "Veeraj"
    last_name = "Matnale"
    phone = "+919876543210"
} | ConvertTo-Json

Write-Output "================================"
Write-Output "Creating Platform Admin..."
Write-Output "================================"
Write-Output ""

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/platform-admin/register' `
        -Method Post `
        -Body $body `
        -ContentType 'application/json' `
        -ErrorAction Stop
    
    Write-Output "✅ SUCCESS!"
    Write-Output ""
    Write-Output "Platform Admin Created:"
    Write-Output "----------------------"
    Write-Output ($response | ConvertTo-Json -Depth 10)
    
} catch {
    $statusCode = $null
    $errorMessage = ""
    
    if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errorMessage = $reader.ReadToEnd()
        $reader.Close()
    } else {
        $errorMessage = $_.Exception.Message
    }
    
    Write-Output "❌ FAILED!"
    Write-Output ""
    if ($statusCode) {
        Write-Output "HTTP Status: $statusCode"
    }
    Write-Output "Error: $errorMessage"
}

Write-Output ""
Write-Output "================================"
