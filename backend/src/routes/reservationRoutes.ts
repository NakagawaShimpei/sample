import { Router } from 'express';
import reservationController from '../controllers/ReservationController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.get('/', authenticate, reservationController.list);
router.post('/', authenticate, reservationController.create);
router.delete('/:id', authenticate, reservationController.remove);

export default router;
