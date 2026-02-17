# Quick fix script for Railway image size issue
Write-Host "🔧 Railway Image Size Fix" -ForegroundColor Cyan
Write-Host ""

$backendPath = "C:\An\Omni_channel_chatbot\backend"

# Check files exist
Write-Host "Checking files..." -ForegroundColor Yellow
$requiredFiles = @(
    "$backendPath\Dockerfile",
    "$backendPath\requirements.railway.txt",
    "$backendPath\railway.toml",
    "$backendPath\.dockerignore"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $(Split-Path $file -Leaf)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $(Split-Path $file -Leaf) MISSING!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Files OK! Ready to deploy." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Commit files:" -ForegroundColor White
Write-Host "   git add ." -ForegroundColor Gray
Write-Host "   git commit -m 'Fix: Reduce Docker image size to 2GB'" -ForegroundColor Gray
Write-Host "   git push" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Update Railway Settings:" -ForegroundColor White
Write-Host "   - Go to: https://railway.app/dashboard" -ForegroundColor Gray
Write-Host "   - Click your project → Settings" -ForegroundColor Gray
Write-Host "   - Build section:" -ForegroundColor Gray
Write-Host "     * Builder: DOCKERFILE" -ForegroundColor Gray
Write-Host "     * Root Directory: backend" -ForegroundColor Gray
Write-Host "     * Dockerfile Path: Dockerfile" -ForegroundColor Gray
Write-Host "   - Save Changes" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Railway will auto-redeploy (~6-7 min)" -ForegroundColor White
Write-Host ""
Write-Host "4. After deploy success, run migration:" -ForegroundColor White
Write-Host "   railway run alembic upgrade head" -ForegroundColor Gray
Write-Host ""
Write-Host "Expected result: Image size ~2 GB (within 4 GB limit) ✅" -ForegroundColor Green
