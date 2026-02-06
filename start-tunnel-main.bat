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
where cloudflared >nul 2>&1
if %errorlevel% neq 0 (
    if exist "%USERPROFILE%\Downloads\cloudflared-windows-amd64.exe" (
        set CLOUDFLARED_CMD=%USERPROFILE%\Downloads\cloudflared-windows-amd64.exe
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
    set CLOUDFLARED_CMD=cloudflared
)

echo [1/3] Starting Cloudflare Tunnel...
echo.

REM ログファイル
set LOG_FILE=%TEMP%\cloudflared-tunnel.log
if exist "%LOG_FILE%" del "%LOG_FILE%"

REM トンネル起動（別ウィンドウで表示）
start "Cloudflare Tunnel - Check URL here" cmd /k "%CLOUDFLARED_CMD% tunnel --url http://127.0.0.1:3000 2>&1 | powershell -Command \"$input | Tee-Object -FilePath '%LOG_FILE%' -Append\""

echo [2/3] Waiting for tunnel URL...
timeout /t 8 /nobreak >nul

REM PowerShellでURL抽出とブラウザ起動
powershell -Command "$url = (Get-Content '%LOG_FILE%' -Raw -ErrorAction SilentlyContinue | Select-String -Pattern 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' | ForEach-Object { $_.Matches.Value } | Select-Object -First 1); if ($url) { Write-Host ''; Write-Host '========================================' -ForegroundColor Green; Write-Host ' 🌐 Tunnel URL' -ForegroundColor Green; Write-Host '========================================' -ForegroundColor Green; Write-Host ''; Write-Host \"  $url\" -ForegroundColor White; Write-Host ''; Write-Host '[SUCCESS] Opening browser...' -ForegroundColor Green; Start-Process $url; Write-Host '✅ Browser opened!' -ForegroundColor Green; Write-Host ''; Write-Host '📱 Mobile Access: Copy this URL to your phone' -ForegroundColor Cyan; Write-Host \"   $url\" -ForegroundColor Yellow; Write-Host ''; } else { Write-Host '[INFO] Tunnel is starting...' -ForegroundColor Yellow; Write-Host 'Check the Cloudflare Tunnel window for the URL' -ForegroundColor Gray; Write-Host ''; }"

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

REM サーバー起動
npm run dev

echo.
echo ========================================
echo Server stopped
echo ========================================
pause
