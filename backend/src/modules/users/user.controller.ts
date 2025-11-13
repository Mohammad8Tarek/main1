import { Request, Response } from 'express';
import httpStatus from 'http-status';
import asyncHandler from '../../utils/asyncHandler';
import { userService } from './user.service';
import ApiResponse from '../../utils/apiResponse';
import { AuthRequest } from '../../middleware/auth.middleware';

const createUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.createUser(req.body);
    res.status(httpStatus.CREATED).send(new ApiResponse(httpStatus.CREATED, user, 'User created successfully'));
});

const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const users = await userService.getAllUsers();
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, users));
});

const getUserById = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getUserById(req.params.id);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, user));
});

const updateUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.updateUser(req.params.id, req.body);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, user, 'User updated successfully'));
});

const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    await userService.deleteUser(req.params.id);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, null, 'User deleted successfully'));
});

const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Admin can change anyone's password without the current one.
    // A regular user can change their own password, but needs the current one.
    // This endpoint is admin-only based on the route, but this logic is for future expansion.
    if (id !== req.user?.id) { 
        await userService.updateUser(id, { password: newPassword });
    } else {
        await userService.changeOwnPassword(id, currentPassword, newPassword);
    }
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, null, 'Password updated successfully'));
});


export const userController = {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    changePassword,
};
