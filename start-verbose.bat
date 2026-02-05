@echo off
title Spotify Music Server - Verbose Logs
color 0A
cls

echo.
echo ╔════════════════════════════════════════╗
echo ║   Spotify Music Server - Verbose      ║
echo ║   Real-time Logs                      ║
echo ╚════════════════════════════════════════╝
echo.

REM 環境情報を表示
echo [SYSTEM INFO]
echo Node version: 
node --version
echo NPM version:
npm --version
echo Current directory: %CD%
echo.

REM データベースの初期化
echo ========================================
echo [STEP 1/3] Database Initialization
echo ========================================
echo.
echo Running: npm run db:generate
call npm run db:generate
echo.
echo Running: npm run db:push
call npm run db:push
echo.
echo [OK] Database initialized successfully
echo.

REM サーバー起動
echo ========================================
echo [STEP 2/3] Starting Server
echo ========================================
echo.
echo Server Configuration:
echo - Host: 0.0.0.0 (accessible from network)
echo - Port: 3000
echo - Mode: Development
echo.
echo Access URLs:
echo   Local:   http://localhost:3000
echo   Network: http://[YOUR-IP]:3000
echo.
echo Pages:
echo   Home:      http://localhost:3000
echo   Dashboard: http://localhost:3000/admin/dashboard
echo   Upload:    http://localhost:3000/upload
echo.

echo ========================================
echo [STEP 3/3] Server Logs (Real-time)
echo ========================================
echo.
echo [INFO] Server starting...
echo [INFO] Press Ctrl+C to stop
echo.
echo ----------------------------------------
echo.

REM サーバーを起動（詳細ログ付き）
set DEBUG=*
npm run dev

REM サーバーが停止した場合
echo.
echo ========================================
echo [INFO] Server stopped
echo ========================================
echo.
pause