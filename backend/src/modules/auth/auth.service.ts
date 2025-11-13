
import prisma from '../../database/prisma';
import { Prisma, User, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import ApiError from '../../utils/apiError';
import { generateTokens, verifyToken } from '../../utils/jwt';
import config from '../../config';
import logger from '../../utils/logger';
import { activityLogService } from '../activity-log/activity-log.service';

const login = async (username: string, pass: string) => {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !(await bcrypt.compare(pass, user.password))) {
        await activityLogService.createLog({ username, action: 'Failed login attempt: Invalid credentials' });
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect username or password');
    }

    if (user.status !== 'ACTIVE') {
        await activityLogService.createLog({ username, action: 'Failed login attempt: Account inactive' });
        throw new ApiError(httpStatus.FORBIDDEN, 'Your account is inactive');
    }

    const tokens = generateTokens({ id: user.id, roles: user.roles });
    
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await prisma.refreshToken.create({
        data: {
            token: tokens.refreshToken,
            userId: user.id,
            expiresAt,
        }
    });
    
    await activityLogService.createLog({ username, action: 'User logged in successfully' });
    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, tokens };
};

const refreshToken = async (token: string) => {
    const refreshTokenDoc = await prisma.refreshToken.findUnique({ where: { token } });
    if (!refreshTokenDoc || refreshTokenDoc.expiresAt < new Date()) {
        if (refreshTokenDoc) {
             await prisma.refreshToken.delete({ where: { token } });
        }
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired refresh token');
    }
    
    const decoded = verifyToken(token, config.jwt_refresh_secret) as { id: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
    }

    await prisma.refreshToken.delete({ where: { token } });
    const newTokens = generateTokens({ id: user.id, roles: user.roles });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
        data: {
            token: newTokens.refreshToken,
            userId: user.id,
            expiresAt,
        }
    });

    return newTokens;
};

const logout = async (token: string) => {
    const refreshTokenDoc = await prisma.refreshToken.findUnique({ 
        where: { token },
        include: { user: { select: { username: true } } } 
    });
    if (!refreshTokenDoc) {
        logger.warn(`Logout attempt with invalid refresh token.`);
        return;
    }
    await prisma.refreshToken.delete({ where: { token } });
    if (refreshTokenDoc.user) {
        await activityLogService.createLog({ username: refreshTokenDoc.user.username, action: 'User logged out' });
    }
};

export const authService = {
    login,
    refreshToken,
    logout,
};