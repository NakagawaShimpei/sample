import { SqliteRepository } from './SqliteRepository';
import { Loan } from '../types';

class LoanRepository extends SqliteRepository<Loan> {
  constructor() {
    super('loans', 'ln');
  }
}

export const loanRepository = new LoanRepository();
