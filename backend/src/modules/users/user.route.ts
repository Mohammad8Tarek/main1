
import { Router } from 'express';
import validate from '../../middleware/validate.middleware';
import { userController } from './user.controller';
import { userValidation } from './user.validation';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.patch('/me/change-password', authMiddleware(), validate(userValidation.changePassword), userController.changePassword);

router.use(authMiddleware(['SUPER_ADMIN', 'ADMIN']));

router.route('/')
    .post(validate(userValidation.createUser), userController.createUser)
    .get(userController.getAllUsers);

router.route('/:id')
    .get(validate(userValidation.getUser), userController.getUserById)
    .patch(validate(userValidation.updateUser), userController.updateUser)
    .delete(validate(userValidation.deleteUser), userController.deleteUser);

export default router;