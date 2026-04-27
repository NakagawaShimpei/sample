import { reservationRepository } from '../repositories/ReservationRepository';
import { Reservation } from '../types';

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function hasOverlap(a: Reservation, b: Omit<Reservation, 'id'>): boolean {
  if (a.roomId !== b.roomId || a.date !== b.date) return false;
  const aStart = toMinutes(a.startTime);
  const aEnd   = toMinutes(a.endTime);
  const bStart = toMinutes(b.startTime);
  const bEnd   = toMinutes(b.endTime);
  return aStart < bEnd && bStart < aEnd;
}

const reservationService = {
  findAll(): Reservation[] {
    return reservationRepository.findAll();
  },

  async create(data: Omit<Reservation, 'id'>): Promise<Reservation> {
    const existing = reservationRepository.findAll();
    const conflict = existing.find((r) => hasOverlap(r, data));
    if (conflict) {
      throw Object.assign(new Error('指定の日時はすでに予約が入っています'), { status: 409 });
    }
    return reservationRepository.create(data);
  },

  async delete(id: string): Promise<void> {
    await reservationRepository.delete(id);
  },
};

export default reservationService;
