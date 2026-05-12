import { Router } from 'express';
import authController from '../controllers/AuthController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);
router.put('/password', authenticate, authController.changePassword);

export default router;
