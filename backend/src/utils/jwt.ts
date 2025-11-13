import jwt from 'jsonwebtoken';
import config from '../config';
import { User, Role } from '@prisma/client';

export const generateTokens = (user: { id: string, roles: Role[] }) => {
    const accessTokenPayload = { id: user.id, roles: user.roles };
    const refreshTokenPayload = { id: user.id };

    const accessToken = jwt.sign(accessTokenPayload, config.jwt_secret, {
        expiresIn: config.jwt_expires_in,
    });
    const refreshToken = jwt.sign(refreshTokenPayload, config.jwt_refresh_secret, {
        expiresIn: config.jwt_refresh_expires_in,
    });
    return { accessToken, refreshToken };
};

export const verifyToken = (token: string, secret: string) => {
    return jwt.verify(token, secret);
};
