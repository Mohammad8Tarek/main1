
import { Router } from 'express';
import validate from '../../middleware/validate.middleware';
import { assignmentController } from './assignment.controller';
import { assignmentValidation } from './assignment.validation';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware(['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'SUPERVISOR']));

router.route('/')
    .post(validate(assignmentValidation.createAssignment), assignmentController.createAssignment)
    .get(assignmentController.getAllAssignments);

router.patch('/:id/reassign', validate(assignmentValidation.reassign), assignmentController.reassignEmployee);
router.patch('/:id/checkout', validate(assignmentValidation.checkout), assignmentController.checkoutEmployee);


export default router;
