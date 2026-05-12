import { Router } from 'express';
import { chatController } from '../controllers/ChatController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.post('/', authenticate, chatController.chat);

export default router;
