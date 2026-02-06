@echo off
chcp 65001 >nul
title Music Player with Cloudflare Tunnel
color 0B

echo.
echo ========================================
echo  🎵 Music Player with Cloudflare Tunnel
echo  (Auto Browser Open)
echo ========================================
echo.

REM cloudflaredの確認
echo Checking for cloudflared...
where cloudflared >nul 2>&1
if %errorlevel% neq 0 (
    echo cloudflared not found in PATH
    if exist "%USERPROFILE%\Downloads\cloudflared-windows-amd64.exe" (
        set "CLOUDFLARED_CMD=%USERPROFILE%\Downloads\cloudflared-windows-amd64.exe"
        echo [OK] Found cloudflared in Downloads folder
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
    echo [OK] Found cloudflared in PATH
)

echo.
echo [1/3] Starting Cloudflare Tunnel...
echo.

REM ログファイル
set "LOG_FILE=%TEMP%\cloudflared-tunnel.log"
if exist "%LOG_FILE%" del "%LOG_FILE%"

REM トンネル起動（別ウィンドウで表示 - ウィンドウを開いたまま）
echo Starting tunnel window...
start "Cloudflare Tunnel - Check URL here" cmd /k ""%CLOUDFLARED_CMD%" tunnel --url http://127.0.0.1:3000"

REM ログファイル取得用に別プロセス（バックグラウンド）
timeout /t 2 /nobreak >nul
start /B "" cmd /c ""%CLOUDFLARED_CMD%" tunnel --url http://127.0.0.1:3000 > "%LOG_FILE%" 2>&1"

echo Waiting for tunnel to initialize...
timeout /t 8 /nobreak >nul

REM PowerShellでURL抽出とブラウザ起動
echo.
echo [2/3] Extracting tunnel URL...
powershell -NoProfile -Command "$url = ''; if (Test-Path '%LOG_FILE%') { $content = Get-Content '%LOG_FILE%' -Raw -ErrorAction SilentlyContinue; if ($content -match 'https://[a-zA-Z0-9-]+\.trycloudflare\.com') { $url = $matches[0]; Write-Host ''; Write-Host '========================================' -ForegroundColor Green; Write-Host ' 🌐 Tunnel URL' -ForegroundColor Green; Write-Host '========================================' -ForegroundColor Green; Write-Host ''; Write-Host \"  $url\" -ForegroundColor White; Write-Host ''; Write-Host '[SUCCESS] Opening browser...' -ForegroundColor Green; Start-Process $url; Write-Host '✅ Browser opened!' -ForegroundColor Green; Write-Host ''; Write-Host '📱 Mobile Access: Copy this URL to your phone' -ForegroundColor Cyan; Write-Host \"   $url\" -ForegroundColor Yellow; Write-Host ''; } } if (-not $url) { Write-Host '[INFO] Tunnel is starting...' -ForegroundColor Yellow; Write-Host 'Check the Cloudflare Tunnel window for the URL' -ForegroundColor Gray; Write-Host ''; }"

echo.
echo [3/3] Starting Music Player Server...
echo.
echo ========================================
echo  Server: http://localhost:3000
echo  Tunnel: Check the Cloudflare window
echo ========================================
echo.
echo Server logs will appear below:
echo ----------------------------------------
echo.

REM サーバー起動（このウィンドウで実行）
npm run dev

echo.
echo ========================================
echo Server stopped
echo ========================================
echo.
echo Press any key to close this window...
pause >nul
