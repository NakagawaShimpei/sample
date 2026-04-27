import { Router } from 'express';
import mfaController from '../controllers/MfaController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.get('/setup', authenticate, mfaController.setup);
router.post('/enable', authenticate, mfaController.enable);
router.post('/verify', mfaController.verify);
router.delete('/disable', authenticate, mfaController.disable);

export default router;
