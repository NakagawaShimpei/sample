import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { config } from './config';
import { auditLog } from './middleware/auditLog';
import authRoutes from './routes/authRoutes';
import chatRoutes from './routes/chatRoutes';
import deviceRoutes from './routes/deviceRoutes';
import historyRoutes from './routes/historyRoutes';
import loanRoutes from './routes/loanRoutes';
import mfaRoutes from './routes/mfaRoutes';
import reservationRoutes from './routes/reservationRoutes';
import roomRoutes from './routes/roomRoutes';
import userRoutes from './routes/userRoutes';

const app = express();

app.use(helmet({
  // APIサーバーはHTMLを返さないため、コンテンツの読み込みをすべて禁止
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  // フレーム埋め込みを完全禁止（デフォルトはSAMEORIGIN）
  frameguard: { action: 'deny' },
  // リファラー情報を送信しない
  referrerPolicy: { policy: 'no-referrer' },
  // 同一オリジン以外からのリソース読み込みを禁止
  crossOriginResourcePolicy: { policy: 'same-origin' },
  // HSTSは本番のみ有効（localhostで有効にするとブラウザが設定を永続記憶して開発に支障が出る）
  hsts: process.env.NODE_ENV === 'production'
    ? { maxAge: 63072000, includeSubDomains: true, preload: true }
    : false,
}));
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(auditLog);

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/users', userRoutes);
app.use('/api', historyRoutes);
app.use('/api/mfa', mfaRoutes);

app.listen(config.PORT, () => {
  console.log(`Backend API running on http://localhost:${config.PORT}`);
});
