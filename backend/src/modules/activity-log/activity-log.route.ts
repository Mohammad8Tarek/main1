import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { activityLogController } from './activity-log.controller';

const router = Router();

router.use(authMiddleware(['super_admin', 'admin']));

router.route('/')
    .get(activityLogController.getAllLogs)
    .post(activityLogController.createLogEntry);

export default router;
