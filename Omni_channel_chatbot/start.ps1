# ChatDesk - Quick Start Script
# Run backend and frontend together

Write-Host "=== Starting ChatDesk ===" -ForegroundColor Cyan

# Start backend
Write-Host "`nStarting backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\An\Omni_channel_chatbot\backend; C:/An/Omni_channel_chatbot/.venv/Scripts/python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

Start-Sleep -Seconds 2

# Start frontend
Write-Host "Starting frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\An\Omni_channel_chatbot\frontend; npm run dev"

Start-Sleep -Seconds 3

Write-Host "`n✓ ChatDesk started!" -ForegroundColor Green
Write-Host "`nBackend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "`nPress any key to open browser..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Start-Process "http://localhost:5173"
