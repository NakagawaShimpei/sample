import { deviceRepository } from '../repositories/DeviceRepository';
import { loanRepository } from '../repositories/LoanRepository';
import { Loan } from '../types';

const LONG_LOAN_HOURS = 8;

export interface LoanAlert {
  loan: Loan;
  deviceName: string;
  hoursElapsed: number;
  overdueHours?: number;
}

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

  findAlerts(): { overdueLoans: LoanAlert[]; longDurationLoans: LoanAlert[] } {
    const now = new Date();
    const loans = loanRepository.findAll();
    const overdueLoans: LoanAlert[] = [];
    const longDurationLoans: LoanAlert[] = [];

    for (const loan of loans) {
      const borrowedAt = new Date(loan.borrowedAt);
      const hoursElapsed = (now.getTime() - borrowedAt.getTime()) / 3_600_000;
      const device = deviceRepository.findById(loan.deviceId);
      const deviceName = device?.name ?? '(削除済み)';

      if (loan.expectedReturnAt) {
        const expected = new Date(loan.expectedReturnAt);
        if (now > expected) {
          const overdueHours = (now.getTime() - expected.getTime()) / 3_600_000;
          overdueLoans.push({ loan, deviceName, hoursElapsed, overdueHours });
        }
      } else if (hoursElapsed >= LONG_LOAN_HOURS) {
        longDurationLoans.push({ loan, deviceName, hoursElapsed });
      }
    }

    return { overdueLoans, longDurationLoans };
  },
};

export default loanService;
