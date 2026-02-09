#!/usr/bin/env node

/**
 * Cloudflare Pages デプロイ準備スクリプト
 * 
 * Next.jsビルド後に実行され、Pagesデプロイに必要な設定を行います。
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Cloudflare Pages デプロイ準備中...');

// .nextディレクトリの確認
const nextDir = path.join(process.cwd(), '.next');
if (!fs.existsSync(nextDir)) {
  console.error('❌ .next ディレクトリが見つかりません。先に npm run build を実行してください。');
  process.exit(1);
}

// _redirects と _headers を .next/static にコピー
const filesToCopy = ['_redirects', '_headers'];

filesToCopy.forEach(file => {
  const src = path.join(process.cwd(), file);
  const dest = path.join(nextDir, file);
  
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✅ ${file} をコピーしました`);
  } else {
    console.warn(`⚠️  ${file} が見つかりません（スキップ）`);
  }
});

console.log('✨ Cloudflare Pages デプロイ準備完了！');
console.log('');
console.log('📝 次のステップ:');
console.log('1. GitHubにプッシュ: git push origin main');
console.log('2. Cloudflare Pagesでデプロイ');
console.log('');
