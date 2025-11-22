# Production Deployment Script for TriVerse ERP
# Run this script from the project root

Write-Host "=== TriVerse ERP Production Deployment ===" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"
$projectRoot = "N:\PROJECTS\TriVerse ERP"

# Stop any running development servers
Write-Host "1. Stopping development servers..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "   ✓ Development servers stopped" -ForegroundColor Green
Write-Host ""

# Backend Build
Write-Host "2. Building Backend..." -ForegroundColor Yellow
Set-Location "$projectRoot\backend"

Write-Host "   - Installing dependencies..."
npm ci --production=false --silent

Write-Host "   - Generating Prisma Client..."
npx prisma generate

Write-Host "   - Building TypeScript..."
npm run build

Write-Host "   ✓ Backend built successfully" -ForegroundColor Green
Write-Host ""

# Frontend Build
Write-Host "3. Building Frontend..." -ForegroundColor Yellow
Set-Location "$projectRoot\frontend"

Write-Host "   - Installing dependencies..."
npm ci --silent

Write-Host "   - Building React app..."
npm run build

Write-Host "   ✓ Frontend built successfully" -ForegroundColor Green
Write-Host ""

# Database Check
Write-Host "4. Checking Database..." -ForegroundColor Yellow
Set-Location "$projectRoot\backend"

try {
    $envContent = Get-Content .env -Raw
    $dbUrl = ($envContent -split "`n" | Where-Object { $_ -match "^DATABASE_URL=" }) -replace "DATABASE_URL=", ""
    $env:DATABASE_URL = $dbUrl
    Write-Host "   - Running Prisma migrations..."
    npx prisma migrate deploy
    Write-Host "   ✓ Database migrations complete" -ForegroundColor Green
}
catch {
    Write-Host "   ⚠ Database migration failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Please check your DATABASE_URL in .env" -ForegroundColor Yellow
}
Write-Host ""

# Create PM2 ecosystem file
Write-Host "5. Creating PM2 configuration..." -ForegroundColor Yellow
$ecosystem = @"
module.exports = {
  apps: [{
    name: 'triverse-backend',
    script: './dist/main.js',
    cwd: '$projectRoot\\backend',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '1G',
    restart_delay: 4000,
    autorestart: true
  }]
};
"@

Set-Location "$projectRoot"
$ecosystem | Out-File -FilePath "ecosystem.config.js" -Encoding UTF8
Write-Host "   ✓ PM2 configuration created" -ForegroundColor Green
Write-Host ""

# Check if PM2 is installed
Write-Host "6. Checking PM2..." -ForegroundColor Yellow
try {
    $pm2Version = pm2 --version 2>&1
    Write-Host "   ✓ PM2 is installed (version $pm2Version)" -ForegroundColor Green
}
catch {
    Write-Host "   ⚠ PM2 not found. Installing..." -ForegroundColor Yellow
    npm install -g pm2
    npm install -g pm2-windows-startup
    pm2-startup install
    Write-Host "   ✓ PM2 installed" -ForegroundColor Green
}
Write-Host ""

# Start Backend with PM2
Write-Host "7. Starting Backend with PM2..." -ForegroundColor Yellow
Set-Location "$projectRoot"
pm2 delete triverse-backend 2>$null
pm2 start ecosystem.config.js
pm2 save
Write-Host "   ✓ Backend started" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "=== Deployment Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:" -ForegroundColor White
Write-Host "  - Running on: http://localhost:3000" -ForegroundColor Gray
Write-Host "  - API Docs: http://localhost:3000/api/docs" -ForegroundColor Gray
Write-Host "  - Status: pm2 status" -ForegroundColor Gray
Write-Host "  - Logs: pm2 logs triverse-backend" -ForegroundColor Gray
Write-Host ""
Write-Host "Frontend:" -ForegroundColor White
Write-Host "  - Built files in: $projectRoot\frontend\dist" -ForegroundColor Gray
Write-Host "  - Serve with: npx serve -s frontend/dist -l 80" -ForegroundColor Gray
Write-Host "  - Or configure IIS/nginx to serve the dist folder" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Configure IIS or nginx to serve frontend/dist" -ForegroundColor White
Write-Host "  2. Update CORS_ORIGIN in backend/.env with your domain" -ForegroundColor White
Write-Host "  3. Set up SSL certificate for HTTPS" -ForegroundColor White
Write-Host "  4. Configure database backups" -ForegroundColor White
Write-Host ""
Write-Host "To serve frontend immediately (dev):" -ForegroundColor Cyan
Write-Host "  cd frontend && npx serve -s dist -l 5173" -ForegroundColor Gray
Write-Host ""

# Show PM2 status
pm2 status
