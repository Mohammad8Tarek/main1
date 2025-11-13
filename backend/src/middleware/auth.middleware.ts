import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import ApiError from '../utils/apiError';
import { verifyToken } from '../utils/jwt';
import config from '../config';
import prisma from '../database/prisma';
import { Role } from '@prisma/client';

// FIX: Changed `AuthRequest` from an interface to a type intersection. This correctly
// combines Express's `Request` type with custom properties, resolving issues where
// standard properties like `headers`, `body`, and `params` were not recognized.
export type AuthRequest = Request & {
    user?: {
        id: string;
        roles: Role[];
    }
};

export const authMiddleware = (requiredRoles: string[] = []) => async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
        }

        const decoded = verifyToken(token, config.jwt_secret) as { id: string; roles: Role[] };
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });

        if (!user) {
            return next(new ApiError(httpStatus.UNAUTHORIZED, 'User not found'));
        }
        
        if (requiredRoles.length && !user.roles.some(role => requiredRoles.includes(role))) {
            return next(new ApiError(httpStatus.FORBIDDEN, 'Forbidden: You do not have the required role'));
        }

        req.user = { id: user.id, roles: user.roles };
        next();
    } catch (error) {
        return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }
};