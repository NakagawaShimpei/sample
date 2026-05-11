import { UserRecord } from '../types';
import { SqliteRepository } from './SqliteRepository';

class UserRepository extends SqliteRepository<UserRecord> {
  constructor() {
    super('users', 'u');
  }

  findByUsername(username: string): UserRecord | undefined {
    return this.findWhere((u) => u.username === username)[0];
  }

  removeTotpSecret(id: string): Promise<void> {
    return this.update(id, {
      totpSecret: undefined,
    } as Partial<UserRecord>).then(() => {});
  }
}

export const userRepository = new UserRepository();
