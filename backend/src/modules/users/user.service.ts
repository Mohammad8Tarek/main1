
import prisma from '../../database/prisma';
import { Prisma, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import ApiError from '../../utils/apiError';
import logger from '../../utils/logger';

const createUser = async (userData: Prisma.UserCreateInput): Promise<Partial<User>> => {
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
    logger.info(`Admin created user: ${user.username}`);
    return userWithoutPassword;
};

const getAllUsers = async (): Promise<Partial<User>[]> => {
    const users = await prisma.user.findMany({
        select: { id: true, username: true, email: true, role: true, status: true, createdAt: true },
    });
    return users;
};

const getUserById = async (id: string): Promise<Partial<User> | null> => {
    const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, username: true, email: true, role: true, status: true },
    });
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    return user;
};

const updateUser = async (id: string, updateData: Prisma.UserUpdateInput): Promise<Partial<User>> => {
    await getUserById(id); // Check if user exists

    if (updateData.password && typeof updateData.password === 'string') {
        updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    
    const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
    });

    const { password, ...userWithoutPassword } = updatedUser;
    logger.info(`Admin updated user: ${updatedUser.username}`);
    return userWithoutPassword;
};

const deleteUser = async (id: string): Promise<void> => {
    const user = await getUserById(id); // Check if user exists
    await prisma.user.delete({ where: { id } });
    logger.info(`Admin deleted user: ${user?.username}`);
};

const changePassword = async (userId: string, currentPass: string, newPass: string): Promise<void> => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    
    const isPasswordMatch = await bcrypt.compare(currentPass, user.password);
    if (!isPasswordMatch) throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect current password.');

    const hashedNewPassword = await bcrypt.hash(newPass, 10);
    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
    });
    logger.info(`User changed their password: ${user.username}`);
};


export const userService = {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    changePassword,
};