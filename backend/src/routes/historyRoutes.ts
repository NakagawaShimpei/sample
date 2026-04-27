import { Router } from 'express';
import historyController from '../controllers/HistoryController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.get('/reservationHistory', authenticate, historyController.reservationHistory);
router.get('/loanHistory', authenticate, historyController.loanHistory);

export default router;
