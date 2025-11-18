
import { Router } from 'express';
import validate from '../../middleware/validate.middleware';
import { authController } from './auth.controller';
import { authValidation } from './auth.validation';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);
router.post('/refresh-token', validate(authValidation.refreshToken), authController.refreshToken);
router.post('/logout', validate(authValidation.refreshToken), authController.logout);

// Example protected route
router.get('/profile', authMiddleware(), (req: any, res) => {
    res.json({ message: `Welcome user ${req.user.id}` });
});


export default router;
