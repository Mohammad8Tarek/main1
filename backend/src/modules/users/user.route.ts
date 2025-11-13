import { Router } from 'express';
import validate from '../../middleware/validate.middleware';
import { userController } from './user.controller';
import { userValidation } from './user.validation';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware(['super_admin', 'admin']));

router.route('/')
    .post(validate(userValidation.createUser), userController.createUser)
    .get(userController.getAllUsers);

router.post('/:id/change-password', validate(userValidation.changePassword), userController.changePassword);

router.route('/:id')
    .get(validate(userValidation.getUser), userController.getUserById)
    .patch(validate(userValidation.updateUser), userController.updateUser)
    .delete(validate(userValidation.deleteUser), userController.deleteUser);

export default router;
