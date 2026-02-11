const nodemailer = require('nodemailer');

/**
 * トンネルURLをメールで送信
 * @param {string} tunnelUrl - CloudflareトンネルのURL
 * @param {string} recipientEmail - 送信先メールアドレス
 */
async function sendTunnelEmail(tunnelUrl, recipientEmail = 'kenta4126.2201@gmail.com') {
  try {
    console.log('📧 メール送信開始...');
    console.log('   送信元:', process.env.EMAIL_USER);
    console.log('   送信先:', recipientEmail);
    console.log('   トンネルURL:', tunnelUrl);
    
    // Gmailを使用する場合の設定
    // 注意: Gmailの場合、アプリパスワードを使用する必要があります
    // https://support.google.com/accounts/answer/185833
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // 送信元Gmailアドレス
        pass: process.env.EMAIL_PASS  // Gmailアプリパスワード
      }
    });
    
    console.log('📤 SMTP接続確認中...');

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: '🎵 Music Server - Cloudflare Tunnel URL',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #1db954; margin-bottom: 20px;">🎵 Music Server Started</h1>
            
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              音楽サーバーが起動しました！以下のURLからアクセスできます：
            </p>
            
            <div style="background-color: #f0f0f0; border-left: 4px solid #1db954; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0; font-size: 14px; color: #666;">Cloudflare Tunnel URL:</p>
              <a href="${tunnelUrl}" style="font-size: 18px; color: #1db954; text-decoration: none; font-weight: bold; word-break: break-all;">
                ${tunnelUrl}
              </a>
            </div>
            
            <div style="background-color: #e8f5e9; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <h3 style="color: #2e7d32; margin-top: 0;">📱 アクセス方法</h3>
              <ol style="color: #333; line-height: 1.8;">
                <li>上記のURLをクリックまたはコピー</li>
                <li>ブラウザで開く</li>
                <li>音楽を楽しむ！🎶</li>
              </ol>
            </div>
            
            <div style="background-color: #fff3e0; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <h3 style="color: #e65100; margin-top: 0;">⚠️ 注意事項</h3>
              <ul style="color: #333; line-height: 1.8;">
                <li>このURLはサーバーが起動している間のみ有効です</li>
                <li>サーバーを再起動すると新しいURLが発行されます</li>
                <li>URLは他の人と共有しないでください</li>
              </ul>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
              このメールは自動送信されています<br>
              Music Server - Cloudflare Tunnel Notification
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ メール送信成功:', info.messageId);
    console.log('   送信先:', recipientEmail);
    console.log('   応答:', info.response);
    return true;
  } catch (error) {
    console.error('❌ メール送信エラー:');
    console.error('   エラーメッセージ:', error.message);
    console.error('   エラーコード:', error.code);
    console.error('   詳細:', error);
    return false;
  }
}

module.exports = { sendTunnelEmail };

// スクリプトとして直接実行された場合
if (require.main === module) {
  const tunnelUrl = process.argv[2];
  const recipientEmail = process.argv[3] || 'kenta4126.2201@gmail.com';
  
  if (!tunnelUrl) {
    console.error('使用方法: node send-tunnel-email.js <tunnel-url> [recipient-email]');
    process.exit(1);
  }
  
  sendTunnelEmail(tunnelUrl, recipientEmail)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
