@echo off
title Spotify Music Server - Logs
color 0A
echo.
echo ========================================
echo    Spotify Music Server
echo    Starting with Browser
echo ========================================
echo.

REM データベースの初期化
echo [1/4] Initializing database...
call npm run db:generate >nul 2>&1
call npm run db:push >nul 2>&1
echo [OK] Database initialized
echo.

REM サーバー起動（バックグラウンド）
echo [2/4] Starting Next.js server...
start /B npm run dev

REM サーバーが起動するまで待機
echo [3/4] Waiting for server to start...
timeout /t 5 /nobreak >nul

REM ブラウザを開く
echo [4/4] Opening browser...
start http://localhost:3000
echo.
echo ========================================
echo [INFO] Server is running!
echo [INFO] Access URLs:
echo        - Home:      http://localhost:3000
echo        - Dashboard: http://localhost:3000/admin/dashboard
echo.
echo [INFO] Press Ctrl+C to stop the server
echo ========================================
echo.

REM ログを表示し続ける
echo Server logs:
echo ----------------------------------------
echo.

REM サーバープロセスを待機
:wait
timeout /t 1 >nul
goto wait