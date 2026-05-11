import { LONG_LOAN_HOURS } from '../constants';
import { Loan } from '../types';

export type LoanAlertStatus = 'overdue' | 'warning' | 'longDuration' | 'normal';

export interface LoanAlertInfo {
  status: LoanAlertStatus;
  hoursElapsed: number;
  overdueHours?: number;
  minutesRemaining?: number;
}

export function getLoanAlertInfo(loan: Loan, now = new Date()): LoanAlertInfo {
  const borrowedAt = new Date(loan.borrowedAt);
  const hoursElapsed = (now.getTime() - borrowedAt.getTime()) / 3_600_000;

  if (loan.expectedReturnAt) {
    const expected = new Date(loan.expectedReturnAt);
    const msRemaining = expected.getTime() - now.getTime();

    if (msRemaining < 0) {
      return {
        status: 'overdue',
        hoursElapsed,
        overdueHours: -msRemaining / 3_600_000,
      };
    }
    if (msRemaining < 3_600_000) {
      return {
        status: 'warning',
        hoursElapsed,
        minutesRemaining: Math.ceil(msRemaining / 60_000),
      };
    }
    return { status: 'normal', hoursElapsed };
  }

  if (hoursElapsed >= LONG_LOAN_HOURS) {
    return { status: 'longDuration', hoursElapsed };
  }
  return { status: 'normal', hoursElapsed };
}

export function formatElapsed(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}
