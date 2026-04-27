import { NextFunction, Request, Response } from 'express';
import authService from '../services/AuthService';

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = req.cookies?.auth_token as string | undefined;
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const payload = authService.verifyToken(token);
  if (!payload) {
    res.clearCookie('auth_token');
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  req.user = payload;
  next();
}
