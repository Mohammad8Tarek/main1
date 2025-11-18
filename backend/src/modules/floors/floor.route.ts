
import { Router } from 'express';
import validate from '../../middleware/validate.middleware';
import { floorController } from '../buildings/building.controller';
import { buildingValidation } from '../buildings/building.validation';
import { authMiddleware } from '../../middleware/auth.middleware';
import { floorService } from '../buildings/building.service';
import asyncHandler from '../../utils/asyncHandler';
import httpStatus from 'http-status';
import ApiResponse from '../../utils/apiResponse';

const router = Router();

router.use(authMiddleware(['SUPER_ADMIN', 'ADMIN', 'MANAGER']));

router.get('/', asyncHandler(async (req, res) => {
    const floors = await floorService.getAllFloors();
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, floors));
}));

router.route('/:floorId')
    .get(validate(buildingValidation.getFloor), floorController.getFloorById)
    .patch(validate(buildingValidation.updateFloor), floorController.updateFloor)
    .delete(validate(buildingValidation.deleteFloor), floorController.deleteFloor);

export default router;