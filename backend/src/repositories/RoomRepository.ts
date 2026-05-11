import { Room } from '../types';
import { SqliteRepository } from './SqliteRepository';

class RoomRepository extends SqliteRepository<Room> {
  constructor() {
    super('rooms', 'r');
  }
}

export const roomRepository = new RoomRepository();
