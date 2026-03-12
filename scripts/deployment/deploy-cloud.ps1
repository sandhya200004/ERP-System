# Vercel + Render Deployment Script
# Quick deployment to cloud platforms

Write-Host "=== TriVerse ERP Cloud Deployment ===" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"
$projectRoot = "N:\PROJECTS\TriVerse ERP"

# Check prerequisites
Write-Host "1. Checking prerequisites..." -ForegroundColor Yellow

# Check if Vercel CLI is installed
try {
    $vercelVersion = vercel --version 2>&1
    Write-Host "   ✓ Vercel CLI installed (version $vercelVersion)" -ForegroundColor Green
}
catch {
    Write-Host "   ⚠ Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
}

# Check if Git is installed
try {
    $gitVersion = git --version 2>&1
    Write-Host "   ✓ Git installed ($gitVersion)" -ForegroundColor Green
}
catch {
    Write-Host "   ✗ Git not found. Please install Git." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check if changes are committed
Write-Host "2. Checking Git status..." -ForegroundColor Yellow
Set-Location $projectRoot

$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "   ⚠ You have uncommitted changes:" -ForegroundColor Yellow
    git status -s
    Write-Host ""
    $commit = Read-Host "   Do you want to commit and push? (y/n)"
    
    if ($commit -eq 'y' -or $commit -eq 'Y') {
        $message = Read-Host "   Enter commit message"
        git add .
        git commit -m "$message"
        git push origin main
        Write-Host "   ✓ Changes committed and pushed" -ForegroundColor Green
    }
    else {
        Write-Host "   ⚠ Continuing without committing changes" -ForegroundColor Yellow
    }
}
else {
    Write-Host "   ✓ Working directory clean" -ForegroundColor Green
}

Write-Host ""

# Build Backend
Write-Host "3. Testing Backend Build..." -ForegroundColor Yellow
Set-Location "$projectRoot\backend"

Write-Host "   - Installing dependencies..."
npm install --silent

Write-Host "   - Generating Prisma Client..."
npx prisma generate

Write-Host "   - Building TypeScript..."
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Backend builds successfully" -ForegroundColor Green
}
else {
    Write-Host "   ✗ Backend build failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Build Frontend
Write-Host "4. Testing Frontend Build..." -ForegroundColor Yellow
Set-Location "$projectRoot\frontend"

Write-Host "   - Installing dependencies..."
npm install --silent

Write-Host "   - Building React app..."
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Frontend builds successfully" -ForegroundColor Green
}
else {
    Write-Host "   ✗ Frontend build failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Deploy Frontend to Vercel
Write-Host "5. Deploying Frontend to Vercel..." -ForegroundColor Yellow
Set-Location "$projectRoot\frontend"

$deployFrontend = Read-Host "   Deploy frontend to Vercel now? (y/n)"

if ($deployFrontend -eq 'y' -or $deployFrontend -eq 'Y') {
    Write-Host "   - Running Vercel deployment..." -ForegroundColor Cyan
    
    $prod = Read-Host "   Deploy to production? (y/n, default: preview)"
    
    if ($prod -eq 'y' -or $prod -eq 'Y') {
        vercel --prod
    }
    else {
        vercel
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ Frontend deployed to Vercel" -ForegroundColor Green
    }
    else {
        Write-Host "   ✗ Vercel deployment failed!" -ForegroundColor Red
    }
}
else {
    Write-Host "   ⊘ Skipped Vercel deployment" -ForegroundColor Gray
    Write-Host "   → Run manually: cd frontend && vercel --prod" -ForegroundColor Gray
}

Write-Host ""

# Instructions for Render
Write-Host "6. Backend Deployment Instructions (Render)" -ForegroundColor Yellow
Write-Host ""
Write-Host "   📝 Manual Steps Required:" -ForegroundColor Cyan
Write-Host "   1. Go to: https://dashboard.render.com/" -ForegroundColor White
Write-Host "   2. Click 'New +' → 'Web Service'" -ForegroundColor White
Write-Host "   3. Connect repository: Vrajm12/triverse-erp" -ForegroundColor White
Write-Host "   4. Configure:" -ForegroundColor White
Write-Host "      - Root Directory: backend" -ForegroundColor Gray
Write-Host "      - Build Command: npm install && npx prisma generate && npm run build" -ForegroundColor Gray
Write-Host "      - Start Command: npm run start:prod" -ForegroundColor Gray
Write-Host "   5. Add Environment Variables:" -ForegroundColor White
Write-Host "      - DATABASE_URL=postgresql://..." -ForegroundColor Gray
Write-Host "      - JWT_SECRET=your-secret-key" -ForegroundColor Gray
Write-Host "      - JWT_REFRESH_SECRET=your-refresh-secret" -ForegroundColor Gray
Write-Host "      - FRONTEND_URL=https://your-app.vercel.app" -ForegroundColor Gray
Write-Host "   6. Click 'Create Web Service'" -ForegroundColor White
Write-Host "   7. After deployment, run migrations:" -ForegroundColor White
Write-Host "      → Go to Shell tab" -ForegroundColor Gray
Write-Host "      → Run: npx prisma db push" -ForegroundColor Gray
Write-Host ""

Write-Host "   📄 Full guide: See VERCEL_RENDER_DEPLOYMENT.md" -ForegroundColor Cyan
Write-Host ""

# Summary
Write-Host "=== Deployment Summary ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ Backend build tested" -ForegroundColor Green
Write-Host "✓ Frontend build tested" -ForegroundColor Green
if ($deployFrontend -eq 'y' -or $deployFrontend -eq 'Y') {
    Write-Host "✓ Frontend deployed to Vercel" -ForegroundColor Green
}
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Deploy backend to Render (see instructions above)" -ForegroundColor White
Write-Host "2. Run database migrations on Render" -ForegroundColor White
Write-Host "3. Update Vercel environment variable VITE_API_URL with Render URL" -ForegroundColor White
Write-Host "4. Test the production deployment" -ForegroundColor White
Write-Host ""
Write-Host "📖 Full Documentation: VERCEL_RENDER_DEPLOYMENT.md" -ForegroundColor Cyan
Write-Host ""

Set-Location $projectRoot
