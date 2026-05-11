import { Request, Response } from 'express';
import reservationService from '../services/ReservationService';
import { RecurringOptions, Reservation } from '../types';

const reservationController = {
  list(_req: Request, res: Response): void {
    res.json(reservationService.findAll());
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body as Omit<Reservation, 'id'>;
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

      if (!patternType) {
        res.status(400).json({ error: 'patternType is required' });
        return;
      }
      if (endType === 'endDate' && !endDate) {
        res.status(400).json({ error: 'endDate is required' });
        return;
      }
      if (endType === 'count' && (!count || count < 1)) {
        res.status(400).json({ error: 'count must be positive' });
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
      res.status(500).json({ error: (e as Error).message });
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
