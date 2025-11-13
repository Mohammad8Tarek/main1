import prisma from '../../database/prisma';
import { Prisma, Reservation } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../../utils/apiError';
import logger from '../../utils/logger';

const createReservation = async (data: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reservation> => {
    const room = await prisma.room.findUnique({ where: { id: data.roomId } });
    if (!room) throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');

    const reservation = await prisma.reservation.create({ 
        data: {
            ...data,
            checkInDate: new Date(data.checkInDate),
            checkOutDate: data.checkOutDate ? new Date(data.checkOutDate) : null,
        }
    });
    
    // Set room status to reserved
    await prisma.room.update({
        where: { id: data.roomId },
        data: { status: 'reserved' }
    });

    logger.info(`Created reservation for room ${room.roomNumber}`);
    return reservation;
};

const getAllReservations = async (): Promise<Reservation[]> => {
    return prisma.reservation.findMany({
        include: { room: true },
        orderBy: { checkInDate: 'asc' },
    });
};

const getReservationById = async (id: string): Promise<Reservation> => {
    const reservation = await prisma.reservation.findUnique({ where: { id } });
    if (!reservation) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Reservation not found');
    }
    return reservation;
};

const updateReservation = async (id: string, updateData: Prisma.ReservationUpdateInput): Promise<Reservation> => {
    await getReservationById(id);
    const updatedReservation = await prisma.reservation.update({ where: { id }, data: updateData });
    logger.info(`Updated reservation ID: ${id}`);
    return updatedReservation;
};

const deleteReservation = async (id: string): Promise<void> => {
    const reservation = await getReservationById(id);
    
    await prisma.reservation.delete({ where: { id } });

    // Check if other reservations exist for the room
    const otherReservations = await prisma.reservation.count({ where: { roomId: reservation.roomId } });
    if (otherReservations === 0) {
        // If no other reservations, set room back to available (if not occupied)
        await prisma.room.updateMany({
            where: { id: reservation.roomId, status: 'reserved' },
            data: { status: 'available' }
        });
    }

    logger.info(`Deleted reservation ID: ${id}`);
};

export const reservationService = {
    createReservation,
    getAllReservations,
    getReservationById,
    updateReservation,
    deleteReservation,
};
