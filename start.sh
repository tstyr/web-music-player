#!/bin/bash

echo "========================================"
echo " Web Music Player"
echo "========================================"
echo ""

# セットアップが必要かチェック
if [ ! -d "node_modules" ]; then
    echo "[INFO] First time setup detected..."
    echo "[INFO] Running setup script..."
    chmod +x setup.sh
    ./setup.sh
    if [ $? -ne 0 ]; then
        exit 1
    fi
    echo ""
fi

# データベースが存在するかチェック
if [ ! -f "prisma/music.db" ]; then
    echo "[INFO] Database not found. Initializing..."
    npm run db:push
    echo ""
fi

echo "[INFO] Starting Music Player Server..."
echo ""
echo "Access URLs:"
echo "  Local:    http://localhost:3001"
echo "  Network:  Check Server Status page for QR code"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# サーバーを起動
npm run dev
