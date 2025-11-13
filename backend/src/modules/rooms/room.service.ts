
import prisma from '../../database/prisma';
import { Prisma, Room } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../../utils/apiError';
import logger from '../../utils/logger';

const createRoom = async (roomData: Prisma.RoomUncheckedCreateInput): Promise<Room> => {
    const floor = await prisma.floor.findUnique({ where: { id: roomData.floorId }});
    if (!floor) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Floor not found');
    }
    const room = await prisma.room.create({ data: roomData });
    logger.info(`Created room: ${room.roomNumber}`);
    return room;
};

const getAllRooms = async (): Promise<Room[]> => {
    return prisma.room.findMany({
        include: { floor: { include: { building: true } }, images: true },
    });
};

const getRoomById = async (id: string): Promise<Room> => {
    const room = await prisma.room.findUnique({
        where: { id },
        include: { floor: { include: { building: true } }, assignments: { include: { employee: true } }, images: true },
    });
    if (!room) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
    }
    return room;
};

const updateRoom = async (id: string, updateData: Prisma.RoomUpdateInput): Promise<Room> => {
    await getRoomById(id);
    const updatedRoom = await prisma.room.update({ where: { id }, data: updateData });
    logger.info(`Updated room: ${updatedRoom.roomNumber}`);
    return updatedRoom;
};

const deleteRoom = async (id: string): Promise<void> => {
    const room = await getRoomById(id);
    if (room.assignments.length > 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete room with active or past assignments.');
    }
    if (room.currentOccupancy > 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete an occupied room.');
    }
    await prisma.room.delete({ where: { id } });
    logger.info(`Deleted room: ${room.roomNumber}`);
};

export const roomService = {
    createRoom,
    getAllRooms,
    getRoomById,
    updateRoom,
    deleteRoom,
};
