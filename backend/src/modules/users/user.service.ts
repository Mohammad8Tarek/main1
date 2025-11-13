
import prisma from '../../database/prisma';
import { Prisma, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import ApiError from '../../utils/apiError';
import logger from '../../utils/logger';
import { activityLogService } from '../activity-log/activity-log.service';

const createUser = async (userData: Prisma.UserCreateInput): Promise<Partial<User>> => {
    const existingUser = await prisma.user.findFirst({
        where: { username: userData.username },
    });
    if (existingUser) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Username already taken');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await prisma.user.create({
        data: {
            ...userData,
            password: hashedPassword,
        },
    });

    await activityLogService.createLog({ username: 'system', action: `Created user: ${user.username}` });
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

const getAllUsers = async (): Promise<Partial<User>[]> => {
    const users = await prisma.user.findMany({
        select: { id: true, username: true, roles: true, status: true, createdAt: true },
        orderBy: { username: 'asc' }
    });
    return users;
};

const getUserById = async (id: string): Promise<Partial<User>> => {
    const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, username: true, roles: true, status: true },
    });
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    return user;
};

const updateUser = async (id: string, updateData: Prisma.UserUpdateInput): Promise<Partial<User>> => {
    const originalUser = await getUserById(id); // Check if user exists

    if (updateData.password && typeof updateData.password === 'string') {
        updateData.password = await bcrypt.hash(updateData.password, 10);
        await activityLogService.createLog({ username: 'system', action: `Reset password for user: ${originalUser.username}` });
    }
    
    const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
    });
    
    await activityLogService.createLog({ username: 'system', action: `Updated user profile: ${updatedUser.username}` });
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
};

const changeOwnPassword = async (id: string, currentPass: string, newPass: string): Promise<void> => {
    const user = await prisma.user.findUnique({ where: { id }});
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    if (!(await bcrypt.compare(currentPass, user.password))) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect current password');
    }
    const hashedPassword = await bcrypt.hash(newPass, 10);
    await prisma.user.update({ where: { id }, data: { password: hashedPassword } });
    await activityLogService.createLog({ username: user.username, action: `User changed their own password` });
};

const deleteUser = async (id: string): Promise<void> => {
    const user = await getUserById(id); // Check if user exists
    await prisma.user.delete({ where: { id } });
    await activityLogService.createLog({ username: 'system', action: `Deleted user: ${user.username}` });
};


export const userService = {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    changeOwnPassword,
};