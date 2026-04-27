import { Router } from 'express';
import userController from '../controllers/UserController';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

router.get('/', authenticate, requireAdmin, userController.list);
router.post('/', authenticate, requireAdmin, userController.create);
router.delete('/:id', authenticate, requireAdmin, userController.remove);

export default router;
