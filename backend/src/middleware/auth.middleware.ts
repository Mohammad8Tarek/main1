
import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import ApiError from '../utils/apiError';
import { verifyToken } from '../utils/jwt';
import config from '../config';
import prisma from '../database/prisma';

interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
    }
}

export const authMiddleware = (roles: string[] = []) => async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // FIX: Cast req to any to access headers, likely due to a type conflict with a global Request type that masks the Express Request type.
        const token = (req as any).headers.authorization?.split(' ')[1];
        if (!token) {
            return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
        }

        const decoded = verifyToken(token, config.jwt_secret) as { id: string; role: string };
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });

        if (!user) {
            return next(new ApiError(httpStatus.UNAUTHORIZED, 'User not found'));
        }
        
        if (roles.length && !roles.includes(user.role)) {
            return next(new ApiError(httpStatus.FORBIDDEN, 'Forbidden: You do not have the required role'));
        }

        req.user = { id: user.id, role: user.role };
        next();
    } catch (error) {
        return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }
};