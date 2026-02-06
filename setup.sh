#!/bin/bash

echo "========================================"
echo " Web Music Player - Auto Setup"
echo "========================================"
echo ""

echo "[1/4] Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install dependencies"
    exit 1
fi

echo ""
echo "[2/4] Generating Prisma client..."
npm run db:generate
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to generate Prisma client"
    exit 1
fi

echo ""
echo "[3/4] Initializing database..."
npm run db:push
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to initialize database"
    exit 1
fi

echo ""
echo "[4/4] Creating music folder..."
mkdir -p uploads/music
touch uploads/music/.gitkeep

echo ""
echo "========================================"
echo " Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Run: npm run dev"
echo "  2. Open: http://localhost:3001"
echo "  3. Upload music or scan folder"
echo ""
echo "For external access:"
echo "  - See QUICKSTART.md for Cloudflare Tunnel setup"
echo ""
