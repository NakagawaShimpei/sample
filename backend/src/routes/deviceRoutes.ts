import { Router } from 'express';
import deviceController from '../controllers/DeviceController';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

router.get('/', authenticate, deviceController.list);
router.post('/', authenticate, requireAdmin, deviceController.create);
router.patch('/:id', authenticate, deviceController.updateStatus);
router.delete('/:id', authenticate, requireAdmin, deviceController.remove);

export default router;
