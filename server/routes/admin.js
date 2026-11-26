import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { stats, activity } from '../controllers/adminController.js';

const router = Router();
router.use(authenticate, authorize('admin'));
router.get('/stats', stats);
router.get('/activity', activity);
export default router;
