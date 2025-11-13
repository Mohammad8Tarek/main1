
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import asyncHandler from '../../utils/asyncHandler';
import { roomService } from './room.service';
import ApiResponse from '../../utils/apiResponse';

const createRoom = asyncHandler(async (req: Request, res: Response) => {
    const room = await roomService.createRoom(req.body);
    res.status(httpStatus.CREATED).send(new ApiResponse(httpStatus.CREATED, room, 'Room created successfully'));
});

const getAllRooms = asyncHandler(async (req: Request, res: Response) => {
    const rooms = await roomService.getAllRooms();
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, rooms));
});

const getRoomById = asyncHandler(async (req: Request, res: Response) => {
    const room = await roomService.getRoomById(req.params.id);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, room));
});

const updateRoom = asyncHandler(async (req: Request, res: Response) => {
    const room = await roomService.updateRoom(req.params.id, req.body);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, room, 'Room updated successfully'));
});

const deleteRoom = asyncHandler(async (req: Request, res: Response) => {
    await roomService.deleteRoom(req.params.id);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, null, 'Room deleted successfully'));
});

export const roomController = {
    createRoom,
    getAllRooms,
    getRoomById,
    updateRoom,
    deleteRoom,
};
