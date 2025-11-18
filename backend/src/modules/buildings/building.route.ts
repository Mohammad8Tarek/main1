
import { Router } from 'express';
import validate from '../../middleware/validate.middleware';
import { buildingController } from './building.controller';
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

export default router;