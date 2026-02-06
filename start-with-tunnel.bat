@echo off
chcp 65001 >nul
echo ========================================
echo  🎵 Music Player with Cloudflare Tunnel
echo ========================================
echo.

REM cloudflaredコマンドのパスを検出
set CLOUDFLARED_CMD=cloudflared
where cloudflared >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] cloudflared not found in PATH, checking Downloads folder...
    if exist "%USERPROFILE%\Downloads\cloudflared-windows-amd64.exe" (
        set CLOUDFLARED_CMD=%USERPROFILE%\Downloads\cloudflared-windows-amd64.exe
        echo [OK] Found cloudflared at: %USERPROFILE%\Downloads\
    ) else (
        echo [WARNING] cloudflared not found!
        echo.
        echo Please install cloudflared:
        echo   1. Download from: https://github.com/cloudflare/cloudflared/releases
        echo   2. Or run: winget install --id Cloudflare.cloudflared
        echo.
        echo Starting server without tunnel...
        goto :start_server
    )
) else (
    echo [OK] cloudflared found in PATH
)

echo.
echo [INFO] Starting Cloudflare Quick Tunnel...
echo [INFO] This will create a temporary public URL (no configuration needed)
echo [INFO] Tunnel target: http://127.0.0.1:3000
echo.

REM ログファイルのパス
set TUNNEL_LOG=%TEMP%\cloudflared-tunnel.log

REM 既存のログファイルを削除
if exist "%TUNNEL_LOG%" del "%TUNNEL_LOG%"

REM Cloudflare Quick Tunnelを別ウィンドウで起動（ウィンドウ表示 + ログファイル保存）
start "Cloudflare Tunnel - Check URL here" cmd /k "%CLOUDFLARED_CMD% tunnel --url http://127.0.0.1:3000 2>&1 | powershell -Command \"$input | Tee-Object -FilePath '%TUNNEL_LOG%' -Append\""

echo [INFO] Waiting for tunnel to start...
timeout /t 8 /nobreak >nul

REM トンネルURLを抽出
set TUNNEL_URL=
for /f "tokens=*" %%a in ('findstr /r "https://.*trycloudflare.com" "%TUNNEL_LOG%"') do (
    for /f "tokens=*" %%b in ("%%a") do (
        set LINE=%%b
    )
)

REM URLを抽出（より確実な方法）
for /f "tokens=*" %%a in ('type "%TUNNEL_LOG%"') do (
    echo %%a | findstr /r "https://.*trycloudflare.com" >nul
    if not errorlevel 1 (
        for /f "tokens=2 delims=|" %%b in ("%%a") do (
            set TUNNEL_URL=%%b
        )
    )
)

REM URLのトリミング
if defined TUNNEL_URL (
    set TUNNEL_URL=%TUNNEL_URL: =%
)

echo.
echo ========================================
echo  🌐 Public URL
echo ========================================
echo.

if defined TUNNEL_URL (
    echo [SUCCESS] Tunnel URL: %TUNNEL_URL%
    echo.
    echo [INFO] Opening browser...
    start "" "%TUNNEL_URL%"
    echo.
    echo ✅ Browser opened automatically!
) else (
    echo [WARNING] Could not extract tunnel URL automatically
    echo [INFO] Please check the Cloudflare Tunnel window for the URL
    echo [INFO] It should look like: https://xxxxx.trycloudflare.com
)

echo.
echo ========================================
echo  📱 スマホでアクセスする方法
echo ========================================
echo.
if defined TUNNEL_URL (
    echo 1. このURLをスマホのブラウザで開く: %TUNNEL_URL%
    echo 2. または、QRコード生成サイトでQRコード化:
) else (
    echo 1. 上の「Cloudflare Tunnel」ウィンドウを確認
    echo 2. 「https://xxxxx.trycloudflare.com」のようなURLが表示されます
    echo 3. そのURLをスマホのブラウザで開いてください
    echo.
    echo 💡 QRコードを生成する場合:
)
echo    - https://www.qr-code-generator.com/
echo    - https://qrcode.tec-it.com/
echo.
echo ========================================
echo.

:start_server
echo [INFO] Starting Music Player Server on http://localhost:3000
echo.

REM Node.jsサーバーを起動
npm run dev

pause
