import 'dotenv/config';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    '環境変数 JWT_SECRET が設定されていません。.env ファイルを確認してください。',
  );
}

const TOTP_ENCRYPTION_KEY = process.env.TOTP_ENCRYPTION_KEY;
if (!TOTP_ENCRYPTION_KEY || Buffer.from(TOTP_ENCRYPTION_KEY, 'hex').length !== 32) {
  throw new Error(
    '環境変数 TOTP_ENCRYPTION_KEY が設定されていません。64文字の16進数文字列を設定してください。',
  );
}

export const config = {
  JWT_SECRET,
  TOTP_ENCRYPTION_KEY: TOTP_ENCRYPTION_KEY as string,
  JWT_EXPIRES_IN: '24h',
  PORT: Number(process.env.PORT) || 3001,
  INACTIVITY_TIMEOUT_MS:
    Number(process.env.INACTIVITY_TIMEOUT_MS) || 30 * 60 * 1000,
  COOKIE_OPTIONS: {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  },
  SMTP: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || process.env.SMTP_USER || '',
  },
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
};
