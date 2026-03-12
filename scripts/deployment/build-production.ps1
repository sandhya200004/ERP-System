# TriVerse ERP - Simple Production Build Script

Write-Host "=== TriVerse ERP Production Build ===" -ForegroundColor Cyan
Write-Host ""

$projectRoot = "N:\PROJECTS\TriVerse ERP"
$ErrorActionPreference = "Continue"

# Stop development servers
Write-Host "1. Stopping development servers..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "   Done" -ForegroundColor Green
Write-Host ""

# Build Backend
Write-Host "2. Building Backend..." -ForegroundColor Yellow
Set-Location "$projectRoot\backend"
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Backend built successfully" -ForegroundColor Green
} else {
    Write-Host "   ✗ Backend build failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Build Frontend
Write-Host "3. Building Frontend..." -ForegroundColor Yellow
Set-Location "$projectRoot\frontend"
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Frontend built successfully" -ForegroundColor Green
} else {
    Write-Host "   ✗ Frontend build failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Start Backend
Write-Host "4. Starting Backend..." -ForegroundColor Yellow
Set-Location "$projectRoot\backend"
$env:NODE_ENV = "production"
$proc = Start-Process -NoNewWindow -FilePath "node" -ArgumentList "dist/main" -PassThru
Write-Host "   ✓ Backend started (PID: $($proc.Id))" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "=== Build Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:" -ForegroundColor White
Write-Host "  PID: $($proc.Id)" -ForegroundColor Gray
Write-Host "  URL: http://localhost:3000" -ForegroundColor Gray
Write-Host "  API Docs: http://localhost:3000/api/docs" -ForegroundColor Gray
Write-Host ""
Write-Host "Frontend:" -ForegroundColor White
Write-Host "  Built in: $projectRoot\frontend\dist" -ForegroundColor Gray
Write-Host ""
Write-Host "To serve frontend:" -ForegroundColor Yellow
Write-Host "  cd '$projectRoot\frontend'" -ForegroundColor Gray
Write-Host "  npx serve -s dist -l 5173" -ForegroundColor Gray
Write-Host ""
Write-Host "Or copy dist folder to your web server (IIS/nginx)" -ForegroundColor Yellow
Write-Host ""
