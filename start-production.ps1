# TriVerse ERP - Production Startup Script
# Build Date: February 15, 2026
# Status: PRODUCTION READY

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   TriVerse ERP - Production Startup" -ForegroundColor White
Write-Host "   Enterprise Resource Planning System" -ForegroundColor Gray
Write-Host "   Version 1.0.0" -ForegroundColor Gray
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = "N:\PROJECTS\TriVerse ERP"
$ErrorActionPreference = "Continue"

# Check if build artifacts exist
Write-Host "Checking build artifacts..." -ForegroundColor Yellow
if (-not (Test-Path "$projectRoot\backend\dist\main.js")) {
    Write-Host "❌ Backend build not found. Run: npm run build in backend folder" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path "$projectRoot\frontend\dist\index.html")) {
    Write-Host "❌ Frontend build not found. Run: npm run build in frontend folder" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build artifacts verified" -ForegroundColor Green
Write-Host ""

# Check PostgreSQL
Write-Host "Checking PostgreSQL connection..." -ForegroundColor Yellow
try {
    $pgTest = psql -U postgres -d triverse_erp -c "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database connection successful" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Cannot connect to database. Ensure PostgreSQL is running" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  PostgreSQL check skipped" -ForegroundColor Yellow
}
Write-Host ""

# Stop any running instances
Write-Host "Stopping existing instances..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*TriVerse ERP*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "✅ Cleanup complete" -ForegroundColor Green
Write-Host ""

# Start Backend
Write-Host "Starting Backend (Production Mode)..." -ForegroundColor Yellow
Set-Location "$projectRoot\backend"
$env:NODE_ENV = "production"
$backendProc = Start-Process -NoNewWindow -FilePath "node" -ArgumentList "dist/main.js" -PassThru -RedirectStandardOutput "$projectRoot\backend\production.log" -RedirectStandardError "$projectRoot\backend\production-error.log"
Start-Sleep -Seconds 3

if ($backendProc.HasExited) {
    Write-Host "❌ Backend failed to start. Check logs:" -ForegroundColor Red
    Write-Host "   $projectRoot\backend\production-error.log" -ForegroundColor Gray
    exit 1
}
Write-Host "✅ Backend started (PID: $($backendProc.Id))" -ForegroundColor Green
Write-Host ""

# Test Backend Health
Write-Host "Testing backend health..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend health check passed" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Backend health check failed: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# Start Frontend Server (for testing)
Write-Host "Starting Frontend Server..." -ForegroundColor Yellow
Set-Location "$projectRoot\frontend"
$frontendProc = Start-Process -NoNewWindow -FilePath "npx" -ArgumentList "serve -s dist -l 5173 --no-clipboard" -PassThru
Start-Sleep -Seconds 2

if ($frontendProc.HasExited) {
    Write-Host "❌ Frontend server failed to start" -ForegroundColor Red
} else {
    Write-Host "✅ Frontend server started (PID: $($frontendProc.Id))" -ForegroundColor Green
}
Write-Host ""

# Display Summary
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   🚀 TriVerse ERP is NOW RUNNING!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend API:" -ForegroundColor White
Write-Host "  URL:      http://localhost:3000" -ForegroundColor Gray
Write-Host "  Health:   http://localhost:3000/health" -ForegroundColor Gray
Write-Host "  API Docs: http://localhost:3000/api/docs" -ForegroundColor Gray
Write-Host "  PID:      $($backendProc.Id)" -ForegroundColor Gray
Write-Host "  Logs:     $projectRoot\backend\production.log" -ForegroundColor Gray
Write-Host ""
Write-Host "Frontend Application:" -ForegroundColor White
Write-Host "  URL:      http://localhost:5173" -ForegroundColor Gray
Write-Host "  PID:      $($frontendProc.Id)" -ForegroundColor Gray
Write-Host ""
Write-Host "Database:" -ForegroundColor White
Write-Host "  Host:     localhost:5432" -ForegroundColor Gray
Write-Host "  Database: triverse_erp" -ForegroundColor Gray
Write-Host ""
Write-Host "Default Login Credentials:" -ForegroundColor White
Write-Host "  CEO:      charudatta.warke@triverse.com / TS2025001@2025" -ForegroundColor Gray
Write-Host "  CTO:      veeraj.matnale@triverse.com / TS2025002@2025" -ForegroundColor Gray
Write-Host "  Developer: vinita.patil@triverse.com / TSTC2025002@2025" -ForegroundColor Gray
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop the servers, run:" -ForegroundColor Yellow
Write-Host "  Stop-Process -Id $($backendProc.Id)" -ForegroundColor Gray
Write-Host "  Stop-Process -Id $($frontendProc.Id)" -ForegroundColor Gray
Write-Host ""
Write-Host "For production deployment, see:" -ForegroundColor Yellow
Write-Host "  - DEPLOYMENT_GUIDE.md" -ForegroundColor Gray
Write-Host "  - PRODUCTION_BUILD_REPORT.md" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to exit (servers will continue running)" -ForegroundColor Yellow
Write-Host ""

# Keep script running
try {
    while ($true) {
        Start-Sleep -Seconds 5
        
        # Check if processes are still running
        if (-not (Get-Process -Id $backendProc.Id -ErrorAction SilentlyContinue)) {
            Write-Host "⚠️  Backend process terminated unexpectedly!" -ForegroundColor Red
            break
        }
        if (-not (Get-Process -Id $frontendProc.Id -ErrorAction SilentlyContinue)) {
            Write-Host "⚠️  Frontend process terminated unexpectedly!" -ForegroundColor Red
            break
        }
    }
} catch {
    Write-Host ""
    Write-Host "Shutdown signal received. Servers are still running in background." -ForegroundColor Yellow
    Write-Host "Use the Stop-Process commands above to terminate them." -ForegroundColor Yellow
}
