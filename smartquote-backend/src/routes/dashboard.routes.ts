import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.get('/sidebar-stats', dashboardController.getSidebarStats.bind(dashboardController));

export default router;
