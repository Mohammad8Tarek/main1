
import { Router } from 'express';
import validate from '../../middleware/validate.middleware';
import { employeeController } from './employee.controller';
import { employeeValidation } from './employee.validation';
import { authMiddleware } from '../../middleware/auth.middleware';
import upload from '../../middleware/multer.middleware';
import { uploadService } from '../uploads/upload.service';

const router = Router();

// Protected routes
router.use(authMiddleware(['SUPER_ADMIN', 'ADMIN', 'HR']));

router.route('/')
    .post(validate(employeeValidation.createEmployee), employeeController.createEmployee)
    .get(employeeController.getAllEmployees);

router.route('/:id')
    .get(validate(employeeValidation.getEmployee), employeeController.getEmployeeById)
    .patch(validate(employeeValidation.updateEmployee), employeeController.updateEmployee)
    .delete(validate(employeeValidation.deleteEmployee), employeeController.deleteEmployee);

router.post(
    '/:id/photo',
    validate(employeeValidation.getEmployee),
    upload.single('photo'),
    uploadService.handleEmployeePhotoUpload
);

export default router;
