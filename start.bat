@echo off
echo ========================================
echo  Web Music Player
echo ========================================
echo.

REM セットアップが必要かチェック
if not exist "node_modules" (
    echo [INFO] First time setup detected...
    echo [INFO] Running setup script...
    call setup.bat
    if %errorlevel% neq 0 exit /b 1
    echo.
)

REM データベースが存在するかチェック
if not exist "prisma\music.db" (
    echo [INFO] Database not found. Initializing...
    call npm run db:push
    echo.
)

echo [INFO] Starting Music Player Server...
echo.
echo Access URLs:
echo   Local:    http://localhost:3001
echo   Network:  Check Server Status page for QR code
echo.
echo Press Ctrl+C to stop the server
echo.

REM サーバーを起動
npm run dev
