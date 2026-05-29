import { Request, Response } from 'express';
import loanService from '../services/LoanService';
import { Loan } from '../types';

const loanController = {
  list(req: Request, res: Response): void {
    const { username, role } = req.user!;
    if (role === 'admin') {
      res.json(loanService.findAll());
    } else {
      res.json(loanService.findByUsername(username));
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body as Omit<Loan, 'id'>;
      if (!data.deviceId || !data.borrowedBy) {
        res.status(400).json({ error: 'deviceId と borrowedBy は必須です' });
        return;
      }
      const loan = await loanService.create(data);
      res.status(201).json(loan);
    } catch (e) {
      const status = (e as { status?: number }).status ?? 500;
      res.status(status).json({ error: (e as Error).message });
    }
  },

  async remove(req: Request, res: Response): Promise<void> {
    await loanService.delete(req.params.id);
    res.status(204).send();
  },

  async returnDevice(req: Request, res: Response): Promise<void> {
    const { deviceId } = req.params;
    await loanService.deleteByDevice(deviceId);
    res.status(204).send();
  },

  getAlerts(_req: Request, res: Response): void {
    res.json(loanService.findAlerts());
  },
};

export default loanController;
