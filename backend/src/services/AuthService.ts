import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { userRepository } from '../repositories/UserRepository';
import { Role } from '../types';

export interface TokenPayload {
  userId: string;
  username: string;
  role: Role;
  displayName: string;
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

    const match = await bcrypt.compare(password, user.password);
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

  verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, config.JWT_SECRET) as TokenPayload;
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
