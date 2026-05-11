import { Request, Response } from 'express';
import { config } from '../config';
import authService, { TokenPayload } from '../services/AuthService';

const authController = {
  async login(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body as {
      username: string;
      password: string;
    };
    if (!username || !password) {
      res.status(400).json({ error: 'username と password は必須です' });
      return;
    }
    const result = await authService.login(username, password);
    if (!result) {
      res.status(401).json({ error: 'ユーザー名またはパスワードが違います' });
      return;
    }

    if (result.mfaRequired) {
      res.json({ mfaRequired: true, mfaToken: result.mfaToken });
      return;
    }

    const user = result.user;
    const payload: TokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      displayName: user.displayName,
    };
    const token = authService.signToken(payload);
    res.cookie('auth_token', token, config.COOKIE_OPTIONS);
    res.json({
      username: user.username,
      role: user.role,
      displayName: user.displayName,
    });
  },

  logout(_req: Request, res: Response): void {
    res.clearCookie('auth_token', {
      httpOnly: config.COOKIE_OPTIONS.httpOnly,
      sameSite: config.COOKIE_OPTIONS.sameSite,
      secure: config.COOKIE_OPTIONS.secure,
      path: config.COOKIE_OPTIONS.path,
    });
    res.json({ message: 'ログアウトしました' });
  },

  me(req: Request, res: Response): void {
    const { username, role, displayName } = req.user!;
    res.json({ username, role, displayName });
  },
};

export default authController;
