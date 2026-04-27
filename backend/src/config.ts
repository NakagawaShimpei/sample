import 'dotenv/config';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('環境変数 JWT_SECRET が設定されていません。.env ファイルを確認してください。');
}

export const config = {
  JWT_SECRET,
  JWT_EXPIRES_IN: '24h',
  PORT: Number(process.env.PORT) || 3001,
  INACTIVITY_TIMEOUT_MS: Number(process.env.INACTIVITY_TIMEOUT_MS) || 30 * 60 * 1000,
  COOKIE_OPTIONS: {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  },
};
