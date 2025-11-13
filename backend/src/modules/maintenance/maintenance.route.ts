
import { Router } from 'express';
import validate from '../../middleware/validate.middleware';
import { maintenanceController } from './maintenance.controller';
import { maintenanceValidation } from './maintenance.validation';
import { authMiddleware } from '../../middleware/auth.middleware';
import upload from '../../middleware/multer.middleware';
import { uploadService } from '../uploads/upload.service';

const router = Router();

router.use(authMiddleware(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'MAINTENANCE']));

router.route('/')
    .post(validate(maintenanceValidation.createRequest), maintenanceController.createRequest)
    .get(maintenanceController.getAllRequests);

router.route('/:id')
    .get(validate(maintenanceValidation.getRequest), maintenanceController.getRequestById)
    .patch(validate(maintenanceValidation.updateRequest), maintenanceController.updateRequest)
    .delete(validate(maintenanceValidation.deleteRequest), maintenanceController.deleteRequest);

router.post(
    '/:id/image',
    validate(maintenanceValidation.getRequest),
    upload.single('image'),
    uploadService.handleMaintenanceImageUpload
);

export default router;
