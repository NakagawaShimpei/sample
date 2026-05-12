import { Request, Response } from 'express';
import reservationService from '../services/ReservationService';
import { RecurringOptions, Reservation } from '../types';

const TIME_RE = /^\d{2}:\d{2}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function toMins(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function validateReservationBase(data: Omit<Reservation, 'id'>): string | null {
  const { roomId, date, startTime, endTime, attendeeCount, meetingName, reservedBy, participants } = data;

  if (!roomId || !date || !startTime || !endTime || !meetingName?.trim() || !reservedBy?.trim()) {
    return '必須項目が不足しています';
  }
  if (!DATE_RE.test(date)) return '日付の形式が正しくありません (YYYY-MM-DD)';
  if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) return '時刻の形式が正しくありません (HH:MM)';

  const today = new Date().toISOString().slice(0, 10);
  if (date < today) return '過去の日付には予約できません';

  if (toMins(endTime) <= toMins(startTime)) return '終了時刻は開始時刻より後にしてください';

  const count = Number(attendeeCount);
  if (!Number.isInteger(count) || count < 1) return '参加人数は1以上の整数を入力してください';

  return null;
}

const reservationController = {
  list(_req: Request, res: Response): void {
    res.json(reservationService.findAll());
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body as Omit<Reservation, 'id'>;
      const err = validateReservationBase(data);
      if (err) { res.status(400).json({ error: err }); return; }
      const reservation = await reservationService.create(data);
      res.status(201).json(reservation);
    } catch (e) {
      const status = (e as { status?: number }).status ?? 500;
      res.status(status).json({ error: (e as Error).message });
    }
  },

  async createRecurring(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as Omit<
        Reservation,
        'id' | 'recurringGroupId' | 'recurringPattern'
      > &
        RecurringOptions;

      const {
        patternType,
        dailyInterval,
        weekdaysOnly,
        weeklyInterval,
        weekDays,
        monthlyInterval,
        monthlySubtype,
        monthlyDayOfMonth,
        monthlyWeekOfMonth,
        monthlyDayOfWeek,
        yearlyInterval,
        yearlySubtype,
        yearlyMonth,
        yearlyDayOfMonth,
        yearlyWeekOfMonth,
        yearlyDayOfWeek,
        endType,
        endDate,
        count,
        ...baseData
      } = body;

      const baseErr = validateReservationBase(baseData as Omit<Reservation, 'id'>);
      if (baseErr) { res.status(400).json({ error: baseErr }); return; }

      if (!patternType) {
        res.status(400).json({ error: 'patternType は必須です' });
        return;
      }
      if (endType === 'endDate' && !endDate) {
        res.status(400).json({ error: '終了日を指定してください' });
        return;
      }
      if (endType === 'endDate' && endDate && endDate < baseData.date) {
        res.status(400).json({ error: '終了日は開始日以降を指定してください' });
        return;
      }
      if (endType === 'count' && (!count || count < 1)) {
        res.status(400).json({ error: '反復回数は1以上を入力してください' });
        return;
      }

      const opts: RecurringOptions = {
        patternType,
        dailyInterval: dailyInterval ?? 1,
        weekdaysOnly: weekdaysOnly ?? false,
        weeklyInterval: weeklyInterval ?? 1,
        weekDays: weekDays ?? [],
        monthlyInterval: monthlyInterval ?? 1,
        monthlySubtype: monthlySubtype ?? 'dayOfMonth',
        monthlyDayOfMonth: monthlyDayOfMonth ?? 1,
        monthlyWeekOfMonth: monthlyWeekOfMonth ?? 1,
        monthlyDayOfWeek: monthlyDayOfWeek ?? 1,
        yearlyInterval: yearlyInterval ?? 1,
        yearlySubtype: yearlySubtype ?? 'dayOfMonth',
        yearlyMonth: yearlyMonth ?? 1,
        yearlyDayOfMonth: yearlyDayOfMonth ?? 1,
        yearlyWeekOfMonth: yearlyWeekOfMonth ?? 1,
        yearlyDayOfWeek: yearlyDayOfWeek ?? 1,
        endType,
        endDate,
        count,
      };

      const result = await reservationService.createRecurring(baseData, opts);
      res.status(201).json(result);
    } catch (e) {
      const status = (e as { status?: number }).status ?? 500;
      res.status(status).json({ error: (e as Error).message });
    }
  },

  async remove(req: Request, res: Response): Promise<void> {
    await reservationService.delete(req.params.id);
    res.status(204).send();
  },

  async removeGroup(req: Request, res: Response): Promise<void> {
    await reservationService.deleteGroup(req.params.groupId);
    res.status(204).send();
  },
};

export default reservationController;
