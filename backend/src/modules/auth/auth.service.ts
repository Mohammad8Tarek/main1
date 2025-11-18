import prisma from '../../database/prisma';
import { Prisma, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import ApiError from '../../utils/apiError';
import { generateTokens, verifyToken } from '../../utils/jwt';
import config from '../../config';
import logger from '../../utils/logger';

const register = async (userData: Prisma.UserCreateInput): Promise<Partial<User>> => {
    const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email: userData.email }, { username: userData.username }] },
    });
    if (existingUser) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Email or username already taken');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await prisma.user.create({
        data: {
            ...userData,
            password: hashedPassword,
        },
    });

    const { password, ...userWithoutPassword } = user;
    logger.info(`User registered: ${user.username}`);
    return userWithoutPassword;
};

const login = async (identifier: string, pass: string) => {
    logger.info(`Login attempt for identifier: ${identifier}`);
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { email: identifier },
                { username: identifier }
            ]
        }
    });

    if (!user) {
        logger.warn(`Login failed: No user found for identifier: ${identifier}`);
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect credentials');
    }

    const isPasswordMatch = await bcrypt.compare(pass, user.password);
    if (!isPasswordMatch) {
        logger.warn(`Login failed: Incorrect password for user: ${user.username}`);
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect credentials');
    }

    if (user.status !== 'ACTIVE') {
        logger.warn(`Inactive user login attempt: ${identifier}`);
        throw new ApiError(httpStatus.FORBIDDEN, 'Your account is inactive');
    }

    const tokens = generateTokens({ id: user.id, role: user.role });
    
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await prisma.refreshToken.create({
        data: {
            token: tokens.refreshToken,
            userId: user.id,
            expiresAt,
        }
    });
    
    logger.info(`User logged in: ${user.username}`);
    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, tokens };
};

const refreshToken = async (token: string) => {
    const refreshTokenDoc = await prisma.refreshToken.findUnique({ where: { token } });
    if (!refreshTokenDoc || refreshTokenDoc.expiresAt < new Date()) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired refresh token');
    }
    
    const decoded = verifyToken(token, config.jwt_refresh_secret) as { id: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
    }

    await prisma.refreshToken.delete({ where: { token } });
    const newTokens = generateTokens({ id: user.id, role: user.role });

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
    const refreshTokenDoc = await prisma.refreshToken.findUnique({ where: { token } });
    if (!refreshTokenDoc) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Refresh token not found');
    }
    await prisma.refreshToken.delete({ where: { token } });
    logger.info(`User logged out, refresh token revoked for user ID: ${refreshTokenDoc.userId}`);
};

export const authService = {
    register,
    login,
    refreshToken,
    logout,
};
