import { Router } from 'express';
import loanController from '../controllers/LoanController';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

router.get('/', authenticate, loanController.list);
router.post('/', authenticate, loanController.create);
router.delete('/device/:deviceId', authenticate, loanController.returnDevice);
router.delete('/:id', authenticate, loanController.remove);

export default router;
