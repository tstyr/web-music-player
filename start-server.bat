@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║  🎵 音楽サーバー + Cloudflare Tunnel 起動スクリプト  ║
echo ╚═══════════════════════════════════════════════════════╝
echo.

REM 依存関係チェック
echo 📦 依存関係をチェック中...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js がインストールされていません
    echo 💡 https://nodejs.org/ からインストールしてください
    pause
    exit /b 1
)

where cloudflared >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ cloudflared がインストールされていません
    echo 💡 インストール方法: winget install cloudflare.cloudflared
    pause
    exit /b 1
)

REM node_modules チェック
if not exist "node_modules\" (
    echo 📦 依存関係をインストール中...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ インストールに失敗しました
        pause
        exit /b 1
    )
)

echo ✅ 依存関係チェック完了
echo.

REM サーバーを別ウィンドウで起動
echo 🚀 音楽サーバーを起動中...
start "音楽サーバー" cmd /k "npm run dev"

REM サーバー起動待機
echo ⏳ サーバーの起動を待機中...
timeout /t 5 /nobreak >nul

REM トンネルを別ウィンドウで起動
echo 🌐 Cloudflare Tunnel を起動中...
start "Cloudflare Tunnel" cmd /k "npm run tunnel:auto"

echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║  ✅ 起動完了！                                        ║
echo ╚═══════════════════════════════════════════════════════╝
echo.
echo 💡 2つのウィンドウが開きました:
echo    1. 音楽サーバー (localhost:3000)
echo    2. Cloudflare Tunnel (自動URL送信)
echo.
echo 💡 各ウィンドウで Ctrl+C を押すと停止できます
echo.
pause
