
import prisma from '../../database/prisma';
import { Prisma, MaintenanceRequest } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../../utils/apiError';
import logger from '../../utils/logger';

const createRequest = async (data: Prisma.MaintenanceRequestUncheckedCreateInput): Promise<MaintenanceRequest> => {
    const room = await prisma.room.findUnique({ where: { id: data.roomId }});
    if (!room) throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');

    const request = await prisma.maintenanceRequest.create({ data });
    logger.info(`Created maintenance request for room ID: ${data.roomId}`);
    return request;
};

const getAllRequests = async (): Promise<MaintenanceRequest[]> => {
    return prisma.maintenanceRequest.findMany({
        include: { room: true, images: true },
        orderBy: { reportedAt: 'desc' }
    });
};

const getRequestById = async (id: string): Promise<MaintenanceRequest> => {
    const request = await prisma.maintenanceRequest.findUnique({
        where: { id },
        include: { room: true, images: true }
    });
    if (!request) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Maintenance request not found');
    }
    return request;
};

const updateRequest = async (id: string, updateData: Prisma.MaintenanceRequestUpdateInput): Promise<MaintenanceRequest> => {
    await getRequestById(id);
    const updatedRequest = await prisma.maintenanceRequest.update({ where: { id }, data: updateData });
    logger.info(`Updated maintenance request ID: ${id}`);
    return updatedRequest;
};

const deleteRequest = async (id: string): Promise<void> => {
    await getRequestById(id);
    await prisma.maintenanceRequest.delete({ where: { id } });
    logger.info(`Deleted maintenance request ID: ${id}`);
};

export const maintenanceService = {
    createRequest,
    getAllRequests,
    getRequestById,
    updateRequest,
    deleteRequest,
};
