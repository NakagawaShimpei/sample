import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { config } from '../config';
import { userRepository } from '../repositories/UserRepository';

interface ResetEntry {
  userId: string;
  expiresAt: number;
}

// メモリ上にトークンを保持（TTL: 1時間）
const tokenStore = new Map<string, ResetEntry>();

const TOKEN_TTL_MS = 60 * 60 * 1000;

function createTransporter() {
  return nodemailer.createTransport({
    host: config.SMTP.host,
    port: config.SMTP.port,
    secure: config.SMTP.port === 465,
    auth: {
      user: config.SMTP.user,
      pass: config.SMTP.pass,
    },
  });
}

const passwordResetService = {
  async sendResetEmail(email: string): Promise<void> {
    const user = userRepository.findByEmail(email);
    // ユーザーが見つからなくてもエラーを返さない（メールアドレス列挙攻撃対策）
    if (!user) return;

    const token = crypto.randomBytes(32).toString('hex');
    tokenStore.set(token, {
      userId: user.id,
      expiresAt: Date.now() + TOKEN_TTL_MS,
    });

    const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${token}`;
    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"WE サンプルアプリ" <${config.SMTP.from}>`,
      to: email,
      subject: 'パスワード再設定のご案内',
      text: `パスワード再設定のリクエストを受け付けました。\n\n以下のURLから1時間以内に再設定してください。\n\n${resetUrl}\n\nこのメールに心当たりがない場合は無視してください。`,
      html: `
        <p>パスワード再設定のリクエストを受け付けました。</p>
        <p>以下のボタンから1時間以内に再設定してください。</p>
        <p><a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#1e293b;color:#fff;border-radius:6px;text-decoration:none;">パスワードを再設定する</a></p>
        <p style="color:#64748b;font-size:12px;">このメールに心当たりがない場合は無視してください。</p>
      `,
    });
  },

  verifyToken(token: string): string | null {
    const entry = tokenStore.get(token);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      tokenStore.delete(token);
      return null;
    }
    return entry.userId;
  },

  consumeToken(token: string): string | null {
    const userId = this.verifyToken(token);
    if (userId) tokenStore.delete(token);
    return userId;
  },
};

export default passwordResetService;
