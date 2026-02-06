@echo off
title Music Player with Cloudflare Tunnel
color 0B

echo.
echo ========================================
echo  Music Player with Cloudflare Tunnel
echo ========================================
echo.

REM Cloudflare Tunnelを別ウィンドウで起動
echo Starting Cloudflare Tunnel...
start "Cloudflare Tunnel - Check URL here" cmd /k "cloudflared tunnel --url http://127.0.0.1:3000"

echo.
echo Waiting 10 seconds for tunnel to start...
timeout /t 10 /nobreak

echo.
echo ========================================
echo  Starting Server
echo ========================================
echo.
echo Check the Cloudflare Tunnel window for the public URL
echo It will look like: https://xxxxx.trycloudflare.com
echo.
echo Server logs:
echo ----------------------------------------
echo.

REM サーバー起動
npm run dev

echo.
echo ========================================
echo Server stopped
echo ========================================
pause
