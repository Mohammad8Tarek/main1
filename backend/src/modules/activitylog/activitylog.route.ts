
import { Router } from 'express';
import { activityLogController } from './activitylog.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import validate from '../../middleware/validate.middleware';
import { activityLogValidation } from './activitylog.validation';

const router = Router();

router.use(authMiddleware(['SUPER_ADMIN', 'ADMIN']));

router.route('/')
    .get(activityLogController.getAllLogs)
    .post(validate(activityLogValidation.createLog), activityLogController.createLog);

export default router;
