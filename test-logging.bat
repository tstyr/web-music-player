@echo off
chcp 65001 >nul
echo ========================================
echo  🧪 Logging Test Script
echo ========================================
echo.

echo [INFO] This script will test if logs are displayed correctly
echo.

REM サーバーを起動
echo [INFO] Starting server...
echo [INFO] Please access the following URLs and check if logs appear:
echo.
echo   1. Local: http://localhost:3001
echo   2. Via Cloudflare Tunnel (if running)
echo.
echo Expected logs:
echo   - [timestamp] GET / - IP: xxx.xxx.xxx.xxx
echo   - [Socket.io] Client connected: socket-id
echo.
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

npm run dev

pause
