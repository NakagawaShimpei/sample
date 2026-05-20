import bcrypt from 'bcrypt';
import { userRepository } from '../repositories/UserRepository';
import { Role, UserRecord } from '../types';

export const SALT_ROUNDS = 12;

export type PublicUserRecord = Omit<UserRecord, 'password'>;

function omitPassword(user: UserRecord): PublicUserRecord {
  const { password: _pw, ...rest } = user;
  return rest;
}

const userService = {
  findAll(): PublicUserRecord[] {
    return userRepository.findAll().map(omitPassword);
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
    const hashed = await bcrypt.hash(data.password, SALT_ROUNDS);
    const created = await userRepository.create({
      username: data.username,
      password: hashed,
      displayName: data.displayName,
      role: data.role ?? 'user',
      email: data.email,
    });
    return omitPassword(created);
  },

  async delete(id: string): Promise<void> {
    await userRepository.delete(id);
  },
};

export default userService;
