import { Request, Response } from 'express';
import httpStatus from 'http-status';
import asyncHandler from '../../utils/asyncHandler';
import { authService } from './auth.service';
import ApiResponse from '../../utils/apiResponse';

const login = asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body;
    const result = await authService.login(username, password);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, result, 'Login successful'));
});

const refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshToken(refreshToken);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, tokens, 'Tokens refreshed'));
});

const logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, null, 'Logout successful'));
});

export const authController = {
    login,
    refreshToken,
    logout,
};
