@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║  🎵 音楽サーバー + Tunnel (デバッグモード)           ║
echo ╚═══════════════════════════════════════════════════════╝
echo.

REM 環境変数を表示
echo 📧 メール設定確認:
echo    EMAIL_USER: %EMAIL_USER%
if defined EMAIL_PASS (
    echo    EMAIL_PASS: 設定済み
) else (
    echo    EMAIL_PASS: 未設定
)
echo    TUNNEL_EMAIL: %TUNNEL_EMAIL%
echo.

REM .envファイルの存在確認
if exist ".env" (
    echo ✅ .env ファイルが見つかりました
    echo.
    echo 📄 .env の内容:
    type .env | findstr /i "EMAIL"
    echo.
) else (
    echo ❌ .env ファイルが見つかりません
    echo 💡 .env.example をコピーして .env を作成してください
    pause
    exit /b 1
)

REM 依存関係チェック
echo 📦 依存関係をチェック中...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js がインストールされていません
    pause
    exit /b 1
)

where cloudflared >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ cloudflared がインストールされていません
    pause
    exit /b 1
)

echo ✅ 依存関係チェック完了
echo.

REM サーバーを起動
echo 🚀 音楽サーバーを起動中...
start "音楽サーバー" cmd /k "npm run dev"

REM サーバー起動待機
echo ⏳ サーバーの起動を待機中...
timeout /t 5 /nobreak >nul

REM トンネルを起動（同じウィンドウで実行してログを確認）
echo 🌐 Cloudflare Tunnel を起動中...
echo 💡 メール送信のログを確認してください
echo.
npm run tunnel:auto

pause
