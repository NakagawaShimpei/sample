import { deviceRepository } from '../repositories/DeviceRepository';
import { loanRepository } from '../repositories/LoanRepository';
import { Loan } from '../types';

const loanService = {
  findAll(): Loan[] {
    return loanRepository.findAll();
  },

  async create(data: Omit<Loan, 'id'>): Promise<Loan> {
    return loanRepository.create(data);
  },

  async delete(id: string): Promise<void> {
    await loanRepository.delete(id);
  },

  async deleteByDevice(deviceId: string): Promise<void> {
    await loanRepository.deleteWhere((l) => l.deviceId === deviceId);
    await deviceRepository.update(deviceId, { status: 'available' });
  },
};

export default loanService;
