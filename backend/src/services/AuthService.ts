import jwt from 'jsonwebtoken';
import { config } from '../config';
import { userRepository } from '../repositories/UserRepository';
import { Role } from '../types';
import { verifyPassword } from './CryptoService';

export interface TokenPayload {
  userId: string;
  username: string;
  role: Role;
  displayName: string;
}

// パスワード変更時に古いセッションを失効させるためのMap (userId -> 失効基準時刻ms)
const revokedBefore = new Map<string, number>();

export function revokeUserSessions(userId: string): void {
  revokedBefore.set(userId, Date.now());
}

export function isSessionRevoked(userId: string, iatSeconds: number): boolean {
  const threshold = revokedBefore.get(userId);
  if (!threshold) return false;
  return iatSeconds * 1000 < threshold;
}

export interface PublicUser {
  id: string;
  username: string;
  role: Role;
  displayName: string;
}

export type LoginResult =
  | { mfaRequired: true; mfaToken: string }
  | { mfaRequired: false; user: PublicUser };

const authService = {
  async login(username: string, password: string): Promise<LoginResult | null> {
    const user = userRepository.findByUsername(username);
    if (!user) return null;

    const match = await verifyPassword(password, user.password);
    if (!match) return null;

    if (user.totpSecret) {
      const mfaToken = jwt.sign(
        {
          type: 'mfa-pending',
          userId: user.id,
          username: user.username,
          role: user.role,
          displayName: user.displayName,
        },
        config.JWT_SECRET,
        { expiresIn: '5m' },
      );
      return { mfaRequired: true, mfaToken };
    }

    return {
      mfaRequired: false,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        displayName: user.displayName,
      },
    };
  },

  signToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.JWT_SECRET, { expiresIn: '24h' });
  },

  verifyToken(token: string): (TokenPayload & { iat: number }) | null {
    try {
      return jwt.verify(token, config.JWT_SECRET) as TokenPayload & { iat: number };
    } catch {
      return null;
    }
  },

  verifyMfaToken(token: string): (TokenPayload & { type: string }) | null {
    try {
      const payload = jwt.verify(token, config.JWT_SECRET) as TokenPayload & {
        type: string;
      };
      if (payload.type !== 'mfa-pending') return null;
      return payload;
    } catch {
      return null;
    }
  },
};

export default authService;
