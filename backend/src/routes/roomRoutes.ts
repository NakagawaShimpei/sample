import { Router } from 'express';
import roomController from '../controllers/RoomController';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

router.get('/', authenticate, roomController.list);
router.post('/', authenticate, requireAdmin, roomController.create);
router.delete('/:id', authenticate, requireAdmin, roomController.remove);

export default router;
