import { Loan } from '../types';
import { SqliteRepository } from './SqliteRepository';

class LoanRepository extends SqliteRepository<Loan> {
  constructor() {
    super('loans', 'ln');
  }
}

export const loanRepository = new LoanRepository();
