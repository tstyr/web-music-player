@echo off
title Spotify Music Server - Logs
color 0A
echo.
echo ========================================
echo    Spotify Music Server
echo    Real-time Logs
echo ========================================
echo.
echo [INFO] Starting server...
echo [INFO] Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

REM データベースの初期化
echo [1/3] Initializing database...
call npm run db:generate
call npm run db:push
echo.

REM サーバー起動
echo [2/3] Starting Next.js server...
echo [INFO] Server will be available at:
echo        - Local:   http://localhost:3000
echo        - Network: http://0.0.0.0:3000
echo.
echo [3/3] Server logs (real-time):
echo ========================================
echo.

REM サーバーを起動（ウィンドウを閉じない）
npm run dev

REM サーバーが停止した場合
echo.
echo ========================================
echo [INFO] Server stopped
echo.
pause