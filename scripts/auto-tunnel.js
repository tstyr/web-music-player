#!/usr/bin/env node

const { spawn } = require('child_process');
const https = require('https');
const { sendTunnelEmail } = require('./send-tunnel-email');

// 設定
const WORKERS_URL = 'https://music.haka01xx.workers.dev/tunnel';
const PORT = process.env.PORT || 3000;
const TUNNEL_URL_PATTERN = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/;
const RECIPIENT_EMAIL = process.env.TUNNEL_EMAIL || 'kenta4126.2201@gmail.com';

// 色付きコンソール出力
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function box(message, emoji = '🚀') {
  const line = '═'.repeat(message.length + 4);
  log(`╔${line}╗`, colors.cyan);
  log(`║  ${emoji} ${message}  ║`, colors.cyan);
  log(`╚${line}╝`, colors.cyan);
}

// WorkersにURLを送信
async function sendUrlToWorkers(tunnelUrl) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ url: tunnelUrl });
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };

    const req = https.request(WORKERS_URL, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(responseData);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Cloudflare Tunnelを起動
function startTunnel() {
  log('\n🌐 Cloudflare Tunnel を起動中...', colors.blue);
  log(`   ポート: ${PORT}`, colors.cyan);
  
  const tunnel = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${PORT}`], {
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  let urlSent = false;

  // 標準出力を監視
  tunnel.stdout.on('data', (data) => {
    const output = data.toString();
    process.stdout.write(output);

    // トンネルURLを抽出
    if (!urlSent) {
      const match = output.match(TUNNEL_URL_PATTERN);
      if (match) {
        const tunnelUrl = match[0];
        urlSent = true;
        
        log('\n✅ トンネルURL取得成功!', colors.green);
        log(`   URL: ${tunnelUrl}`, colors.bright);
        
        // WorkersにURLを送信
        log('\n📤 WorkersにURL送信中...', colors.yellow);
        sendUrlToWorkers(tunnelUrl)
          .then(() => {
            log('✅ Workers更新成功!', colors.green);
            
            // メール送信
            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
              log('\n📧 メール送信中...', colors.yellow);
              sendTunnelEmail(tunnelUrl, RECIPIENT_EMAIL)
                .then(() => {
                  log(`✅ メール送信成功: ${RECIPIENT_EMAIL}`, colors.green);
                })
                .catch((error) => {
                  log(`⚠️  メール送信失敗: ${error.message}`, colors.yellow);
                });
            } else {
              log('\n⚠️  メール送信スキップ (EMAIL_USER/EMAIL_PASSが未設定)', colors.yellow);
            }
            
            box('準備完了！トンネルが稼働中です', '🎉');
            log(`\n💡 トンネルURL: ${colors.bright}${tunnelUrl}${colors.reset}`);
            log(`💡 Workers URL: ${colors.bright}${WORKERS_URL}${colors.reset}`);
            log(`💡 送信先メール: ${colors.bright}${RECIPIENT_EMAIL}${colors.reset}`);
            log(`\n⚠️  終了するには Ctrl+C を押してください\n`, colors.yellow);
          })
          .catch((error) => {
            log(`❌ Workers更新失敗: ${error.message}`, colors.red);
            log('⚠️  トンネルは稼働していますが、URLは手動で設定してください', colors.yellow);
          });
      }
    }
  });

  // 標準エラー出力も監視（Cloudflaredはstderrにログを出力）
  tunnel.stderr.on('data', (data) => {
    const output = data.toString();
    process.stderr.write(output);
    
    // トンネルURLを抽出（stderrからも）
    if (!urlSent) {
      const match = output.match(TUNNEL_URL_PATTERN);
      if (match) {
        const tunnelUrl = match[0];
        urlSent = true;
        
        log('\n✅ トンネルURL取得成功!', colors.green);
        log(`   URL: ${tunnelUrl}`, colors.bright);
        
        // WorkersにURLを送信
        log('\n📤 WorkersにURL送信中...', colors.yellow);
        sendUrlToWorkers(tunnelUrl)
          .then(() => {
            log('✅ Workers更新成功!', colors.green);
            
            // メール送信
            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
              log('\n📧 メール送信中...', colors.yellow);
              sendTunnelEmail(tunnelUrl, RECIPIENT_EMAIL)
                .then(() => {
                  log(`✅ メール送信成功: ${RECIPIENT_EMAIL}`, colors.green);
                })
                .catch((error) => {
                  log(`⚠️  メール送信失敗: ${error.message}`, colors.yellow);
                });
            } else {
              log('\n⚠️  メール送信スキップ (EMAIL_USER/EMAIL_PASSが未設定)', colors.yellow);
            }
            
            box('準備完了！トンネルが稼働中です', '🎉');
            log(`\n💡 トンネルURL: ${colors.bright}${tunnelUrl}${colors.reset}`);
            log(`💡 Workers URL: ${colors.bright}${WORKERS_URL}${colors.reset}`);
            log(`💡 送信先メール: ${colors.bright}${RECIPIENT_EMAIL}${colors.reset}`);
            log(`\n⚠️  終了するには Ctrl+C を押してください\n`, colors.yellow);
          })
          .catch((error) => {
            log(`❌ Workers更新失敗: ${error.message}`, colors.red);
            log('⚠️  トンネルは稼働していますが、URLは手動で設定してください', colors.yellow);
          });
      }
    }
  });

  // エラーハンドリング
  tunnel.on('error', (error) => {
    log(`\n❌ トンネル起動エラー: ${error.message}`, colors.red);
    
    if (error.code === 'ENOENT') {
      log('\n💡 cloudflared がインストールされていません', colors.yellow);
      log('   インストール方法:', colors.cyan);
      log('   Windows: winget install cloudflare.cloudflared', colors.cyan);
      log('   Mac: brew install cloudflared', colors.cyan);
      log('   Linux: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/', colors.cyan);
    }
    
    process.exit(1);
  });

  tunnel.on('close', (code) => {
    if (code !== 0 && code !== null) {
      log(`\n⚠️  トンネルが終了しました (コード: ${code})`, colors.yellow);
    } else {
      log('\n👋 トンネルを停止しました', colors.cyan);
    }
    process.exit(code || 0);
  });

  // Ctrl+C ハンドリング
  process.on('SIGINT', () => {
    log('\n\n🛑 停止シグナルを受信しました...', colors.yellow);
    tunnel.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    log('\n\n🛑 終了シグナルを受信しました...', colors.yellow);
    tunnel.kill('SIGTERM');
  });
}

// メイン処理
function main() {
  box('Cloudflare Tunnel 自動起動', '🚇');
  startTunnel();
}

main();
