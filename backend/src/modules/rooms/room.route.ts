
import { Router } from 'express';
import validate from '../../middleware/validate.middleware';
import { roomController } from './room.controller';
import { roomValidation } from './room.validation';
import { authMiddleware } from '../../middleware/auth.middleware';
import upload from '../../middleware/multer.middleware';
import { uploadService } from '../uploads/upload.service';


const router = Router();

router.use(authMiddleware(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR']));

router.route('/')
    .post(validate(roomValidation.createRoom), roomController.createRoom)
    .get(roomController.getAllRooms);

router.route('/:id')
    .get(validate(roomValidation.getRoom), roomController.getRoomById)
    .patch(validate(roomValidation.updateRoom), roomController.updateRoom)
    .delete(validate(roomValidation.deleteRoom), roomController.deleteRoom);

router.post(
    '/:id/image',
    validate(roomValidation.getRoom),
    upload.single('image'),
    uploadService.handleRoomImageUpload
);

export default router;
