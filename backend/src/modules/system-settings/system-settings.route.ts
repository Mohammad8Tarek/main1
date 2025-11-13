import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { systemSettingsController } from './system-settings.controller';

const router = Router();

// GET is open to all authenticated users, PUT is admin-only
router.get('/', authMiddleware(), systemSettingsController.getSettings);
router.put('/', authMiddleware(['super_admin', 'admin']), systemSettingsController.updateSettings);

export default router;
