
import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import upload from '../../middleware/multer.middleware';
import { uploadService } from './upload.service';

const router = Router();

router.use(authMiddleware());

router.post('/', upload.single('file'), uploadService.handleGenericUpload);

export default router;
