#!/bin/bash

echo "========================================"
echo " 🎵 Music Player with Cloudflare Tunnel"
echo "========================================"
echo ""

# cloudflaredコマンドのパスを検出
CLOUDFLARED_CMD=""

if command -v cloudflared &> /dev/null; then
    CLOUDFLARED_CMD="cloudflared"
    echo "[OK] cloudflared found in PATH"
elif [ -f "$HOME/Downloads/cloudflared" ]; then
    CLOUDFLARED_CMD="$HOME/Downloads/cloudflared"
    chmod +x "$CLOUDFLARED_CMD"
    echo "[OK] Found cloudflared at: $HOME/Downloads/"
elif [ -f "$HOME/Downloads/cloudflared-linux-amd64" ]; then
    CLOUDFLARED_CMD="$HOME/Downloads/cloudflared-linux-amd64"
    chmod +x "$CLOUDFLARED_CMD"
    echo "[OK] Found cloudflared at: $HOME/Downloads/"
elif [ -f "$HOME/Downloads/cloudflared-darwin-amd64" ]; then
    CLOUDFLARED_CMD="$HOME/Downloads/cloudflared-darwin-amd64"
    chmod +x "$CLOUDFLARED_CMD"
    echo "[OK] Found cloudflared at: $HOME/Downloads/"
else
    echo "[WARNING] cloudflared not found!"
    echo ""
    echo "Please install cloudflared:"
    echo "  macOS: brew install cloudflare/cloudflare/cloudflared"
    echo "  Linux: https://github.com/cloudflare/cloudflared/releases"
    echo ""
    echo "Starting server without tunnel..."
    npm run dev
    exit 0
fi

echo.
echo [INFO] Starting Cloudflare Quick Tunnel...
echo [INFO] This will create a temporary public URL (no configuration needed)
echo ""

# Cloudflare Quick Tunnelをバックグラウンドで起動
"$CLOUDFLARED_CMD" tunnel --url http://127.0.0.1:3001 > /tmp/cloudflared-tunnel.log 2>&1 &
TUNNEL_PID=$!

# トンネルが起動するまで少し待機
sleep 3

# トンネルのURLを表示
echo ""
echo "========================================"
echo " 📱 スマホでアクセスする方法"
echo "========================================"
echo ""
echo "1. 以下のコマンドでトンネルURLを確認:"
echo "   tail -f /tmp/cloudflared-tunnel.log"
echo ""
echo "2. 「https://xxxxx.trycloudflare.com」のようなURLが表示されます"
echo "3. そのURLをスマホのブラウザで開いてください"
echo ""
echo "💡 QRコードを生成する場合:"
echo "   - https://qr-code-generator.com/ にアクセス"
echo "   - 表示されたURLを入力してQRコード生成"
echo "   - スマホでスキャン"
echo ""
echo "または、ターミナルでQRコード表示:"
echo "   curl qrenco.de/\$(grep -oP 'https://[^\\s]+trycloudflare.com' /tmp/cloudflared-tunnel.log | head -1)"
echo ""
echo "========================================"
echo ""

# トンネルのURLを抽出して表示（5秒待機）
sleep 2
if [ -f /tmp/cloudflared-tunnel.log ]; then
    TUNNEL_URL=$(grep -oP 'https://[^\s]+trycloudflare.com' /tmp/cloudflared-tunnel.log | head -1)
    if [ ! -z "$TUNNEL_URL" ]; then
        echo "🌐 Tunnel URL: $TUNNEL_URL"
        echo ""
        
        # QRコードを表示（curlが利用可能な場合）
        if command -v curl &> /dev/null; then
            echo "📱 QR Code:"
            curl -s "qrenco.de/$TUNNEL_URL"
            echo ""
        fi
    fi
fi

echo "[INFO] Starting Music Player Server on http://localhost:3001"
echo ""

# クリーンアップ関数
cleanup() {
    echo ""
    echo "[INFO] Stopping Cloudflare Tunnel..."
    kill $TUNNEL_PID 2>/dev/null
    exit 0
}

# Ctrl+Cでクリーンアップ
trap cleanup INT TERM

# Node.jsサーバーを起動
npm run dev

# サーバー終了時にトンネルも停止
cleanup
