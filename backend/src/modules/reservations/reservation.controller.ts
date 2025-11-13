import { Request, Response } from 'express';
import httpStatus from 'http-status';
import asyncHandler from '../../utils/asyncHandler';
import { reservationService } from './reservation.service';
import ApiResponse from '../../utils/apiResponse';

const createReservation = asyncHandler(async (req: Request, res: Response) => {
    const reservation = await reservationService.createReservation(req.body);
    res.status(httpStatus.CREATED).send(new ApiResponse(httpStatus.CREATED, reservation, 'Reservation created successfully'));
});

const getAllReservations = asyncHandler(async (req: Request, res: Response) => {
    const reservations = await reservationService.getAllReservations();
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, reservations));
});

const getReservationById = asyncHandler(async (req: Request, res: Response) => {
    const reservation = await reservationService.getReservationById(req.params.id);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, reservation));
});

const updateReservation = asyncHandler(async (req: Request, res: Response) => {
    const reservation = await reservationService.updateReservation(req.params.id, req.body);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, reservation, 'Reservation updated successfully'));
});

const deleteReservation = asyncHandler(async (req: Request, res: Response) => {
    await reservationService.deleteReservation(req.params.id);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, null, 'Reservation deleted successfully'));
});

export const reservationController = {
    createReservation,
    getAllReservations,
    getReservationById,
    updateReservation,
    deleteReservation,
};
