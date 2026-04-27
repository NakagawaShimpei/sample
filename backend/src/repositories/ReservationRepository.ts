import { SqliteRepository } from './SqliteRepository';
import { Reservation } from '../types';

class ReservationRepository extends SqliteRepository<Reservation> {
  constructor() {
    super('reservations', 'res');
  }
}

export const reservationRepository = new ReservationRepository();
