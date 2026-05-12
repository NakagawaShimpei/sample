import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { config } from '../config';
import { userRepository } from '../repositories/UserRepository';
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

  async changePassword(req: Request, res: Response): Promise<void> {
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: '現在のパスワードと新しいパスワードは必須です' });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: '新しいパスワードは8文字以上にしてください' });
      return;
    }

    const user = userRepository.findById(req.user!.userId);
    if (!user) { res.status(404).json({ error: 'ユーザーが見つかりません' }); return; }

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) { res.status(400).json({ error: '現在のパスワードが正しくありません' }); return; }

    const hashed = await bcrypt.hash(newPassword, 10);
    await userRepository.update(user.id, { password: hashed });
    res.json({ message: 'パスワードを変更しました' });
  },
};

export default authController;
