import bcrypt from 'bcrypt';
import { userRepository } from '../repositories/UserRepository';
import { Role, UserRecord } from '../types';

const SALT_ROUNDS = 12;

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
  }): Promise<PublicUserRecord> {
    const hashed = await bcrypt.hash(data.password, SALT_ROUNDS);
    const created = await userRepository.create({
      username: data.username,
      password: hashed,
      displayName: data.displayName,
      role: data.role ?? 'user',
    });
    return omitPassword(created);
  },

  async delete(id: string): Promise<void> {
    await userRepository.delete(id);
  },
};

export default userService;
