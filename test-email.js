require('dotenv').config();
const { sendTunnelEmail } = require('./scripts/send-tunnel-email');

console.log('📧 メール送信テスト開始...\n');
console.log('設定確認:');
console.log('  EMAIL_USER:', process.env.EMAIL_USER);
console.log('  EMAIL_PASS:', process.env.EMAIL_PASS ? '設定済み (*****)' : '未設定');
console.log('  TUNNEL_EMAIL:', process.env.TUNNEL_EMAIL);
console.log('');

const testUrl = 'https://test-tunnel-url.trycloudflare.com';

sendTunnelEmail(testUrl, process.env.TUNNEL_EMAIL)
  .then(() => {
    console.log('\n✅ テスト完了！メールボックスを確認してください');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ エラー:', error);
    process.exit(1);
  });
