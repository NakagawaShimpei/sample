import { userRepository } from '../repositories/UserRepository';
import { Role, UserRecord } from '../types';
import { hashPassword } from './CryptoService';

export type PublicUserRecord = Omit<UserRecord, 'password' | 'totpSecret'>;

function omitSensitiveFields(user: UserRecord): PublicUserRecord {
  const { password: _pw, totpSecret: _totp, ...rest } = user;
  return rest;
}

const userService = {
  findAll(): PublicUserRecord[] {
    return userRepository.findAll().map(omitSensitiveFields);
  },

  async create(data: {
    username: string;
    password: string;
    displayName: string;
    role?: Role;
    email?: string;
  }): Promise<PublicUserRecord> {
    if (userRepository.findByUsername(data.username)) {
      throw Object.assign(new Error('このユーザー名はすでに使用されています'), { status: 409 });
    }
    if (data.email && userRepository.findByEmail(data.email)) {
      throw Object.assign(new Error('このメールアドレスはすでに登録されています'), { status: 409 });
    }
    const hashed = await hashPassword(data.password);
    const created = await userRepository.create({
      username: data.username,
      password: hashed,
      displayName: data.displayName,
      role: data.role ?? 'user',
      email: data.email,
    });
    return omitSensitiveFields(created);
  },

  async delete(id: string): Promise<void> {
    await userRepository.delete(id);
  },
};

export default userService;
