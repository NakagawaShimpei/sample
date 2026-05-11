import { Router } from 'express';
import reservationController from '../controllers/ReservationController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.get('/', authenticate, reservationController.list);
router.post('/recurring', authenticate, reservationController.createRecurring);
router.post('/', authenticate, reservationController.create);
router.delete('/group/:groupId', authenticate, reservationController.removeGroup);
router.delete('/:id', authenticate, reservationController.remove);

export default router;
