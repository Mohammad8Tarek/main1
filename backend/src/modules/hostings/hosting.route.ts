import { Router } from 'express';
import validate from '../../middleware/validate.middleware';
import { hostingController } from './hosting.controller';
import { hostingValidation } from './hosting.validation';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware(['super_admin', 'admin', 'manager', 'supervisor', 'hr']));

router.route('/')
    .post(validate(hostingValidation.createHosting), hostingController.createHosting)
    .get(hostingController.getAllHostings);

router.route('/:id')
    .get(validate(hostingValidation.getHosting), hostingController.getHostingById)
    .patch(validate(hostingValidation.updateHosting), hostingController.updateHosting)
    .delete(validate(hostingValidation.deleteHosting), hostingController.deleteHosting);

export default router;
