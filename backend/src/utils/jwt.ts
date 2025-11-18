
import jwt from 'jsonwebtoken';
import config from '../config';
import { User } from '@prisma/client';

export const generateTokens = (user: { id: string, role: string }) => {
    const accessToken = jwt.sign({ id: user.id, role: user.role }, config.jwt_secret, {
        expiresIn: config.jwt_expires_in,
    });
    const refreshToken = jwt.sign({ id: user.id }, config.jwt_refresh_secret, {
        expiresIn: config.jwt_refresh_expires_in,
    });
    return { accessToken, refreshToken };
};

export const verifyToken = (token: string, secret: string) => {
    return jwt.verify(token, secret);
};
