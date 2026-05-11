import { reservationRepository } from '../repositories/ReservationRepository';
import { roomRepository } from '../repositories/RoomRepository';
import { Room } from '../types';

const roomService = {
  findAll(): Room[] {
    return roomRepository.findAll();
  },

  async create(data: Omit<Room, 'id'>): Promise<Room> {
    return roomRepository.create(data);
  },

  async delete(id: string): Promise<void> {
    await reservationRepository.deleteWhere((r) => r.roomId === id);
    await roomRepository.delete(id);
  },
};

export default roomService;
