import { Router } from 'express';
import { settingsController } from './settings.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import validate from '../../middleware/validate.middleware';
import { settingsValidation } from './settings.validation';

const router = Router();

// GET endpoint is public for fetching initial app settings like default language.
router.get('/', settingsController.getSettings);

// PATCH endpoint is protected for updating settings.
router.patch(
    '/',
    authMiddleware(['SUPER_ADMIN', 'ADMIN']),
    validate(settingsValidation.updateSettings),
    settingsController.updateSettings
);

export default router;