import { SqliteRepository } from './SqliteRepository';
import { Room } from '../types';

class RoomRepository extends SqliteRepository<Room> {
  constructor() {
    super('rooms', 'r');
  }
}

export const roomRepository = new RoomRepository();
