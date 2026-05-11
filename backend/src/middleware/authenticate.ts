import { NextFunction, Request, Response } from 'express';
import { config } from '../config';
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
    res.clearCookie('auth_token', {
      httpOnly: config.COOKIE_OPTIONS.httpOnly,
      sameSite: config.COOKIE_OPTIONS.sameSite,
      secure: config.COOKIE_OPTIONS.secure,
      path: config.COOKIE_OPTIONS.path,
    });
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  req.user = payload;
  next();
}
