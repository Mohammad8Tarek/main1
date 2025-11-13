
import { Router } from 'express';
import validate from '../../middleware/validate.middleware';
import { buildingController } from './building.controller';
import { floorController } from './building.controller';
import { buildingValidation } from './building.validation';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware(['SUPER_ADMIN', 'ADMIN', 'MANAGER']));

// Building routes
router.route('/')
    .post(validate(buildingValidation.createBuilding), buildingController.createBuilding)
    .get(buildingController.getAllBuildings);

router.route('/:id')
    .get(validate(buildingValidation.getBuilding), buildingController.getBuildingById)
    .patch(validate(buildingValidation.updateBuilding), buildingController.updateBuilding)
    .delete(validate(buildingValidation.deleteBuilding), buildingController.deleteBuilding);

// Floor routes
router.route('/:id/floors')
    .post(validate(buildingValidation.createFloor), floorController.createFloor)
    .get(validate(buildingValidation.getBuilding), floorController.getFloorsByBuilding);

router.route('/floors/:floorId')
    .get(validate(buildingValidation.getFloor), floorController.getFloorById)
    .patch(validate(buildingValidation.updateFloor), floorController.updateFloor)
    .delete(validate(buildingValidation.deleteFloor), floorController.deleteFloor);


export default router;
