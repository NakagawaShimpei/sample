import { Request, Response } from 'express';
import { config } from '../config';
import { userRepository } from '../repositories/UserRepository';
import authService, { TokenPayload } from '../services/AuthService';
import mfaService from '../services/MfaService';
import { UserRecord } from '../types';

const mfaController = {
  // GET /api/mfa/setup — generates a new TOTP secret for the authenticated user (not saved yet)
  async setup(req: Request, res: Response): Promise<void> {
    const username = req.user!.username;
    const { secret, otpauthUrl } = mfaService.generateSecret(username);
    const qrCodeDataUrl = await mfaService.generateQrCode(otpauthUrl);
    res.json({ secret, qrCode: qrCodeDataUrl });
  },

  // POST /api/mfa/enable — verifies code and persists the secret
  async enable(req: Request, res: Response): Promise<void> {
    const { secret, code } = req.body as { secret: string; code: string };
    if (!secret || !code) {
      res.status(400).json({ error: 'secret と code は必須です' });
      return;
    }
    if (!mfaService.verifyToken(secret, code)) {
      res.status(400).json({ error: 'コードが正しくありません' });
      return;
    }
    const userId = req.user!.userId;
    await userRepository.update(userId, {
      totpSecret: secret,
    } as Partial<UserRecord>);
    res.json({ message: 'MFA が有効になりました' });
  },

  // POST /api/mfa/verify — validates TOTP code during login (mfaToken + code → auth cookie)
  async verify(req: Request, res: Response): Promise<void> {
    const { mfaToken, code } = req.body as { mfaToken: string; code: string };
    if (!mfaToken || !code) {
      res.status(400).json({ error: 'mfaToken と code は必須です' });
      return;
    }

    const pending = authService.verifyMfaToken(mfaToken);
    if (!pending) {
      res.status(401).json({ error: 'MFA セッションが無効または期限切れです' });
      return;
    }

    const user = userRepository.findByUsername(pending.username);
    if (!user?.totpSecret || !mfaService.verifyToken(user.totpSecret, code)) {
      res.status(401).json({ error: 'コードが正しくありません' });
      return;
    }

    const payload: TokenPayload = {
      userId: pending.userId,
      username: pending.username,
      role: pending.role,
      displayName: pending.displayName,
    };
    const token = authService.signToken(payload);
    res.cookie('auth_token', token, config.COOKIE_OPTIONS);
    res.json({
      username: pending.username,
      role: pending.role,
      displayName: pending.displayName,
    });
  },

  // DELETE /api/mfa/disable — removes TOTP secret (disables MFA)
  async disable(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;
    await userRepository.removeTotpSecret(userId);
    res.json({ message: 'MFA を無効にしました' });
  },
};

export default mfaController;
