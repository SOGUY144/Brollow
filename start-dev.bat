@echo off
cd /d "%~dp0"
echo Starting Brollow dev server... (keep this window open)
start "" /min cmd /c "timeout /t 12 /nobreak >nul & start http://localhost:3001"
call npm run dev
echo.
echo Dev server stopped. Copy the error above and send it to Claude.
pause
