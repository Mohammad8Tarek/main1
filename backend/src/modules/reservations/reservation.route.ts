import { Router } from 'express';
import validate from '../../middleware/validate.middleware';
import { reservationController } from './reservation.controller';
import { reservationValidation } from './reservation.validation';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware(['super_admin', 'admin', 'manager', 'supervisor', 'hr']));

router.route('/')
    .post(validate(reservationValidation.createReservation), reservationController.createReservation)
    .get(reservationController.getAllReservations);

router.route('/:id')
    .get(validate(reservationValidation.getReservation), reservationController.getReservationById)
    .patch(validate(reservationValidation.updateReservation), reservationController.updateReservation)
    .delete(validate(reservationValidation.deleteReservation), reservationController.deleteReservation);

export default router;
