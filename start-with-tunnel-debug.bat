@echo off
chcp 65001 >nul
title Music Player with Cloudflare Tunnel (DEBUG MODE)
color 0E

echo.
echo ========================================
echo  🔍 DEBUG MODE - Music Player
echo ========================================
echo.
echo This script will show detailed information
echo to help diagnose any issues.
echo.
pause

echo.
echo [DEBUG] Current directory: %CD%
echo [DEBUG] TEMP directory: %TEMP%
echo.

REM cloudflaredの確認
echo [DEBUG] Checking for cloudflared...
where cloudflared
if %errorlevel% neq 0 (
    echo [DEBUG] cloudflared not found in PATH
    echo [DEBUG] Checking Downloads folder...
    if exist "%USERPROFILE%\Downloads\cloudflared-windows-amd64.exe" (
        set "CLOUDFLARED_CMD=%USERPROFILE%\Downloads\cloudflared-windows-amd64.exe"
        echo [DEBUG] Found: %CLOUDFLARED_CMD%
    ) else (
        echo [ERROR] cloudflared not found!
        echo.
        echo Install: winget install --id Cloudflare.cloudflared
        echo Or download: https://github.com/cloudflare/cloudflared/releases
        echo.
        pause
        exit /b 1
    )
) else (
    set "CLOUDFLARED_CMD=cloudflared"
    echo [DEBUG] Found cloudflared in PATH
)

echo.
echo [DEBUG] Testing cloudflared command...
"%CLOUDFLARED_CMD%" --version
if %errorlevel% neq 0 (
    echo [ERROR] cloudflared command failed!
    pause
    exit /b 1
)

echo.
echo [DEBUG] Checking Node.js...
node --version
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    pause
    exit /b 1
)

echo.
echo [DEBUG] Checking npm...
npm --version
if %errorlevel% neq 0 (
    echo [ERROR] npm not found!
    pause
    exit /b 1
)

echo.
echo [DEBUG] All checks passed!
echo.
pause

echo.
echo [1/3] Starting Cloudflare Tunnel...
echo.

REM ログファイル
set "LOG_FILE=%TEMP%\cloudflared-tunnel.log"
echo [DEBUG] Log file: %LOG_FILE%
if exist "%LOG_FILE%" (
    echo [DEBUG] Deleting old log file...
    del "%LOG_FILE%"
)

REM トンネル起動（別ウィンドウで表示）
echo [DEBUG] Starting tunnel window...
start "Cloudflare Tunnel - Check URL here" cmd /k ""%CLOUDFLARED_CMD%" tunnel --url http://127.0.0.1:3000"

echo [DEBUG] Waiting 3 seconds...
timeout /t 3 /nobreak >nul

REM ログファイル取得用に別プロセス
echo [DEBUG] Starting log process...
start /B "" cmd /c ""%CLOUDFLARED_CMD%" tunnel --url http://127.0.0.1:3000 > "%LOG_FILE%" 2>&1"

echo [DEBUG] Waiting 10 seconds for tunnel to initialize...
timeout /t 10 /nobreak >nul

echo.
echo [2/3] Checking log file...
if exist "%LOG_FILE%" (
    echo [DEBUG] Log file exists
    echo [DEBUG] Log file size:
    dir "%LOG_FILE%" | find ".log"
    echo.
    echo [DEBUG] Log file content (first 20 lines):
    powershell -Command "Get-Content '%LOG_FILE%' -TotalCount 20"
) else (
    echo [WARNING] Log file not found!
)

echo.
echo [DEBUG] Extracting tunnel URL...
powershell -NoProfile -Command "$url = ''; if (Test-Path '%LOG_FILE%') { $content = Get-Content '%LOG_FILE%' -Raw -ErrorAction SilentlyContinue; Write-Host '[DEBUG] Log content length:' $content.Length; if ($content -match 'https://[a-zA-Z0-9-]+\.trycloudflare\.com') { $url = $matches[0]; Write-Host ''; Write-Host '========================================' -ForegroundColor Green; Write-Host ' 🌐 Tunnel URL' -ForegroundColor Green; Write-Host '========================================' -ForegroundColor Green; Write-Host ''; Write-Host \"  $url\" -ForegroundColor White; Write-Host ''; Write-Host '[SUCCESS] Opening browser...' -ForegroundColor Green; Start-Process $url; Write-Host '✅ Browser opened!' -ForegroundColor Green; Write-Host ''; } else { Write-Host '[DEBUG] URL pattern not found in log' -ForegroundColor Yellow; } } else { Write-Host '[DEBUG] Log file does not exist' -ForegroundColor Red; }"

echo.
echo [3/3] Starting Music Player Server...
echo.
echo ========================================
echo  Server: http://localhost:3000
echo  Tunnel: Check the Cloudflare window
echo ========================================
echo.
pause

REM サーバー起動
npm run dev

echo.
echo ========================================
echo Server stopped
echo ========================================
echo.
pause
