#!/bin/bash

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  🎵 音楽サーバー + Cloudflare Tunnel 起動スクリプト  ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# 依存関係チェック
echo -e "${BLUE}📦 依存関係をチェック中...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js がインストールされていません${NC}"
    echo -e "${YELLOW}💡 https://nodejs.org/ からインストールしてください${NC}"
    exit 1
fi

if ! command -v cloudflared &> /dev/null; then
    echo -e "${RED}❌ cloudflared がインストールされていません${NC}"
    echo -e "${YELLOW}💡 インストール方法:${NC}"
    echo -e "${CYAN}   Mac: brew install cloudflared${NC}"
    echo -e "${CYAN}   Linux: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/${NC}"
    exit 1
fi

# node_modules チェック
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 依存関係をインストール中...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ インストールに失敗しました${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ 依存関係チェック完了${NC}"
echo ""

# Ctrl+C ハンドリング
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 停止シグナルを受信しました...${NC}"
    echo -e "${BLUE}👋 サーバーとトンネルを停止中...${NC}"
    kill 0
    exit 0
}

trap cleanup SIGINT SIGTERM

# サーバーとトンネルを同時起動
echo -e "${GREEN}🚀 音楽サーバーとトンネルを起動中...${NC}"
echo ""

npm run start:all

# 終了処理
cleanup
