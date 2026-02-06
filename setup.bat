@echo off
echo ========================================
echo  Web Music Player - Auto Setup
echo ========================================
echo.

echo [1/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/4] Generating Prisma client...
call npm run db:generate
if %errorlevel% neq 0 (
    echo [ERROR] Failed to generate Prisma client
    pause
    exit /b 1
)

echo.
echo [3/4] Initializing database...
call npm run db:push
if %errorlevel% neq 0 (
    echo [ERROR] Failed to initialize database
    pause
    exit /b 1
)

echo.
echo [4/4] Creating music folder...
if not exist "uploads\music" mkdir uploads\music
echo. > uploads\music\.gitkeep

echo.
echo ========================================
echo  Setup Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Run: npm run dev
echo   2. Open: http://localhost:3001
echo   3. Upload music or scan folder
echo.
echo For external access:
echo   - See QUICKSTART.md for Cloudflare Tunnel setup
echo.

pause
