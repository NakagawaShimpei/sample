import { Request, Response } from 'express';
import { config } from '../config';
import { userRepository } from '../repositories/UserRepository';
import authService, { TokenPayload, revokeUserSessions } from '../services/AuthService';
import { hashPassword, verifyPassword } from '../services/CryptoService';
import passwordResetService from '../services/PasswordResetService';

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
    const { userId, username, role, displayName } = req.user!;
    const user = userRepository.findById(userId);
    res.json({ username, role, displayName, email: user?.email ?? null });
  },

  async updateEmail(req: Request, res: Response): Promise<void> {
    const { email } = req.body as { email: string };
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: '有効なメールアドレスを入力してください' });
      return;
    }
    if (email) {
      const existing = userRepository.findByEmail(email);
      if (existing && existing.id !== req.user!.userId) {
        res.status(409).json({ error: 'このメールアドレスはすでに登録されています' });
        return;
      }
    }
    await userRepository.update(req.user!.userId, { email: email || undefined });
    res.json({ email: email || null });
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

    const match = await verifyPassword(currentPassword, user.password);
    if (!match) { res.status(400).json({ error: '現在のパスワードが正しくありません' }); return; }

    const hashed = await hashPassword(newPassword);
    await userRepository.update(user.id, { password: hashed });
    revokeUserSessions(user.id);
    res.clearCookie('auth_token', {
      httpOnly: config.COOKIE_OPTIONS.httpOnly,
      sameSite: config.COOKIE_OPTIONS.sameSite,
      secure: config.COOKIE_OPTIONS.secure,
      path: config.COOKIE_OPTIONS.path,
    });
    res.json({ message: 'パスワードを変更しました' });
  },

  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body as { email: string };
    if (!email) {
      res.status(400).json({ error: 'メールアドレスは必須です' });
      return;
    }
    await passwordResetService.sendResetEmail(email);
    // ユーザーが存在しない場合も同じレスポンスを返す（列挙攻撃対策）
    res.json({ message: 'メールアドレスが登録済みの場合、再設定メールを送信しました' });
  },

  async resetPassword(req: Request, res: Response): Promise<void> {
    const { token, newPassword } = req.body as { token: string; newPassword: string };
    if (!token || !newPassword) {
      res.status(400).json({ error: 'トークンと新しいパスワードは必須です' });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: '新しいパスワードは8文字以上にしてください' });
      return;
    }
    const userId = passwordResetService.consumeToken(token);
    if (!userId) {
      res.status(400).json({ error: 'トークンが無効または期限切れです' });
      return;
    }
    const hashed = await hashPassword(newPassword);
    await userRepository.update(userId, { password: hashed });
    revokeUserSessions(userId);
    const user = userRepository.findById(userId);
    if (user?.email) {
      await passwordResetService.sendPasswordChangedEmail(user.email).catch(() => {});
    }
    res.json({ message: 'パスワードを再設定しました' });
  },
};

export default authController;
