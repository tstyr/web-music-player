@echo off
chcp 65001 >nul
echo ========================================
echo  🎵 Music Player with Cloudflare Tunnel
echo  (Auto Browser Open)
echo ========================================
echo.

REM PowerShellスクリプトを実行
powershell -ExecutionPolicy Bypass -File "%~dp0start-tunnel-helper.ps1"

if errorlevel 1 (
    echo.
    echo [ERROR] Failed to start tunnel
    pause
    exit /b 1
)

echo.
echo [INFO] Starting Music Player Server...
echo.

REM Node.jsサーバーを起動
npm run dev

pause
