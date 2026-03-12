@echo off
echo Starting TriVerse ERP Servers...
echo.

REM Start Backend Server
start "TriVerse Backend" cmd /k "cd /d "%~dp0backend" && npm run start:dev"

REM Wait a moment for backend to initialize
timeout /t 3 /nobreak >nul

REM Start Frontend Server
start "TriVerse Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ================================
echo TriVerse ERP Servers Starting...
echo ================================
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Login Credentials:
echo Email:    veerajmatnale@triverse.com
echo Password: admin123
echo.
echo Press any key to open the application in your browser...
pause >nul

REM Open browser
start http://localhost:5173

echo.
echo Servers are running in separate windows.
echo DO NOT close the Backend and Frontend windows!
echo Close this window when you're done working.
pause
