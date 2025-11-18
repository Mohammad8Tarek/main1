
import { Router } from 'express';
import { reservationController } from './reservation.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR']));

router.route('/')
    .get(reservationController.getAll)
    .post(reservationController.create);

router.route('/:id')
    .get(reservationController.getById)
    .patch(reservationController.update)
    .delete(reservationController.delete);

export default router;