
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import asyncHandler from '../../utils/asyncHandler';
import { reservationService } from './reservation.service';
import ApiResponse from '../../utils/apiResponse';

const create = asyncHandler(async (req: Request, res: Response) => {
    const result = await reservationService.create(req.body);
    res.status(httpStatus.CREATED).send(new ApiResponse(httpStatus.CREATED, result, 'Reservation created'));
});

const getAll = asyncHandler(async (req: Request, res: Response) => {
    const results = await reservationService.getAll();
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, results));
});

const getById = asyncHandler(async (req: Request, res: Response) => {
    const result = await reservationService.getById(req.params.id);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, result));
});

const update = asyncHandler(async (req: Request, res: Response) => {
    const result = await reservationService.update(req.params.id, req.body);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, result, 'Reservation updated'));
});

const deleteById = asyncHandler(async (req: Request, res: Response) => {
    await reservationService.delete(req.params.id);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, null, 'Reservation deleted'));
});

export const reservationController = {
    create,
    getAll,
    getById,
    update,
    delete: deleteById,
};