import prisma from '../../database/prisma';
import { Prisma, Hosting } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../../utils/apiError';
import logger from '../../utils/logger';

const createHosting = async (data: Omit<Hosting, 'id' | 'createdAt' | 'updatedAt'>): Promise<Hosting> => {
    const employee = await prisma.employee.findUnique({ where: { id: data.employeeId } });
    if (!employee) throw new ApiError(httpStatus.NOT_FOUND, 'Host employee not found');

    const hosting = await prisma.hosting.create({ 
        data: {
            ...data,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
        }
    });
    
    // Logic to update room occupancy based on hosting
    const guestCount = Array.isArray(data.guests) ? data.guests.length : 0;
    if (guestCount > 0) {
        const activeAssignment = await prisma.assignment.findFirst({
            where: { employeeId: data.employeeId, checkOutDate: null }
        });
        if (activeAssignment) {
            await prisma.room.update({
                where: { id: activeAssignment.roomId },
                data: { currentOccupancy: { increment: guestCount } }
            });
        }
    }

    logger.info(`Created hosting for employee ${data.employeeId}`);
    return hosting;
};

const getAllHostings = async (): Promise<Hosting[]> => {
    return prisma.hosting.findMany({
        include: { employee: true },
        orderBy: { startDate: 'desc' },
    });
};

const getHostingById = async (id: string): Promise<Hosting> => {
    const hosting = await prisma.hosting.findUnique({ where: { id } });
    if (!hosting) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Hosting not found');
    }
    return hosting;
};

const updateHosting = async (id: string, updateData: Prisma.HostingUpdateInput): Promise<Hosting> => {
    const originalHosting = await getHostingById(id);
    const updatedHosting = await prisma.hosting.update({ where: { id }, data: updateData });

    // If hosting ended, adjust room occupancy
    if (updateData.status === 'COMPLETED' && originalHosting.status !== 'COMPLETED') {
        const guestCount = Array.isArray(originalHosting.guests) ? originalHosting.guests.length : 0;
        if (guestCount > 0) {
            const activeAssignment = await prisma.assignment.findFirst({
                where: { employeeId: originalHosting.employeeId, checkOutDate: null }
            });
            if (activeAssignment) {
                await prisma.room.update({
                    where: { id: activeAssignment.roomId },
                    data: { currentOccupancy: { decrement: guestCount } }
                });
            }
        }
    }

    logger.info(`Updated hosting ID: ${id}`);
    return updatedHosting;
};

const deleteHosting = async (id: string): Promise<void> => {
    await getHostingById(id);
    await prisma.hosting.delete({ where: { id } });
    logger.info(`Deleted hosting ID: ${id}`);
};

export const hostingService = {
    createHosting,
    getAllHostings,
    getHostingById,
    updateHosting,
    deleteHosting,
};
