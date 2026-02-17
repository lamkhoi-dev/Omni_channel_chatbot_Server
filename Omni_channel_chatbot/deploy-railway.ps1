# Quick Deploy Script for Railway
# Run this after setting up Railway project

Write-Host "🚂 ChatDesk Railway Deployment Helper" -ForegroundColor Cyan
Write-Host ""

# Check if railway CLI is installed
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Railway CLI not found. Installing..." -ForegroundColor Red
    Write-Host "Run: npm install -g @railway/cli" -ForegroundColor Yellow
    Write-Host "Or: iwr https://railway.app/install.ps1 -useb | iex" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Railway CLI found" -ForegroundColor Green

# Login check
Write-Host ""
Write-Host "🔐 Checking Railway login..." -ForegroundColor Cyan
railway whoami
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please login first: railway login" -ForegroundColor Yellow
    exit 1
}

# Link project
Write-Host ""
Write-Host "🔗 Linking to Railway project..." -ForegroundColor Cyan
Set-Location backend
railway link

# Run migrations
Write-Host ""
Write-Host "📦 Running database migrations..." -ForegroundColor Cyan
railway run alembic upgrade head

# Seed admin user
Write-Host ""
Write-Host "👤 Seeding admin user..." -ForegroundColor Cyan
$seedContent = Get-Content seed_admin.sql -Raw
railway run "psql `$DATABASE_URL -c '$seedContent'"

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Get your Railway URL: railway status" -ForegroundColor White
Write-Host "2. Update FB_OAUTH_REDIRECT_URI in Railway Variables" -ForegroundColor White
Write-Host "3. Update Facebook App Webhook URL" -ForegroundColor White
Write-Host "4. Test: curl https://your-app.up.railway.app/docs" -ForegroundColor White
