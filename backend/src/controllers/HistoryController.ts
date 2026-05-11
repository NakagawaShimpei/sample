import { Request, Response } from 'express';
import { historyRepository } from '../repositories/HistoryRepository';

const historyController = {
  reservationHistory(_req: Request, res: Response): void {
    res.json(historyRepository.getReservationHistory());
  },

  loanHistory(_req: Request, res: Response): void {
    res.json(historyRepository.getLoanHistory());
  },
};

export default historyController;
