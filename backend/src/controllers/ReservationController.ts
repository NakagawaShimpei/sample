import { Request, Response } from 'express';
import reservationService from '../services/ReservationService';
import { Reservation } from '../types';

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

  async remove(req: Request, res: Response): Promise<void> {
    await reservationService.delete(req.params.id);
    res.status(204).send();
  },
};

export default reservationController;
