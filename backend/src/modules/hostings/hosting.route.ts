
import { Router } from 'express';
import { hostingController } from './hosting.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR']));

router.route('/')
    .get(hostingController.getAll)
    .post(hostingController.create);

router.route('/:id')
    .get(hostingController.getById)
    .patch(hostingController.update)
    .delete(hostingController.delete);

export default router;