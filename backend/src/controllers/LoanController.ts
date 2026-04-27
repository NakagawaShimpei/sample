import { Request, Response } from 'express';
import loanService from '../services/LoanService';
import { Loan } from '../types';

const loanController = {
  list(_req: Request, res: Response): void {
    res.json(loanService.findAll());
  },

  async create(req: Request, res: Response): Promise<void> {
    const data = req.body as Omit<Loan, 'id'>;
    const loan = await loanService.create(data);
    res.status(201).json(loan);
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
};

export default loanController;
