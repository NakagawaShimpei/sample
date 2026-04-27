import { getDb } from '../database';
import { ReservationHistory, LoanHistory } from '../types';

export const historyRepository = {
  getReservationHistory(): ReservationHistory[] {
    const rows = getDb()
      .prepare(`SELECT data FROM "reservationHistory"`)
      .all() as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as ReservationHistory);
  },

  getLoanHistory(): LoanHistory[] {
    const rows = getDb()
      .prepare(`SELECT data FROM "loanHistory"`)
      .all() as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as LoanHistory);
  },
};
