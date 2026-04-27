import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { config } from './config';
import { auditLog } from './middleware/auditLog';
import authRoutes from './routes/authRoutes';
import roomRoutes from './routes/roomRoutes';
import reservationRoutes from './routes/reservationRoutes';
import deviceRoutes from './routes/deviceRoutes';
import loanRoutes from './routes/loanRoutes';
import userRoutes from './routes/userRoutes';
import historyRoutes from './routes/historyRoutes';
import mfaRoutes from './routes/mfaRoutes';

const app = express();

app.use(helmet());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(auditLog);

app.use('/api/auth', authRoutes);
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
