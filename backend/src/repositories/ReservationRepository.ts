import { Reservation } from '../types';
import { SqliteRepository } from './SqliteRepository';

class ReservationRepository extends SqliteRepository<Reservation> {
  constructor() {
    super('reservations', 'res');
  }
}

export const reservationRepository = new ReservationRepository();
