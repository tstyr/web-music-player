@echo off
title Music Server
color 0A

echo Starting Music Server...
echo.

REM データベース初期化（出力を抑制）
npm run db:generate >nul 2>&1
npm run db:push >nul 2>&1

REM サーバー起動
echo Server starting at http://localhost:3000
echo Press Ctrl+C to stop
echo.

npm run dev