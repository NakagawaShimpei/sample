import { NextFunction, Request, Response } from 'express';
import { config } from '../config';
import authService, { isSessionRevoked } from '../services/AuthService';

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
  const cookieClearOptions = {
    httpOnly: config.COOKIE_OPTIONS.httpOnly,
    sameSite: config.COOKIE_OPTIONS.sameSite,
    secure: config.COOKIE_OPTIONS.secure,
    path: config.COOKIE_OPTIONS.path,
  };
  if (!payload) {
    res.clearCookie('auth_token', cookieClearOptions);
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (isSessionRevoked(payload.userId, payload.iat)) {
    res.clearCookie('auth_token', cookieClearOptions);
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  req.user = payload;
  next();
}
