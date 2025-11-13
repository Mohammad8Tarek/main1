import { Request, Response } from 'express';
import httpStatus from 'http-status';
import asyncHandler from '../../utils/asyncHandler';
import { hostingService } from './hosting.service';
import ApiResponse from '../../utils/apiResponse';

const createHosting = asyncHandler(async (req: Request, res: Response) => {
    const hosting = await hostingService.createHosting(req.body);
    res.status(httpStatus.CREATED).send(new ApiResponse(httpStatus.CREATED, hosting, 'Hosting created successfully'));
});

const getAllHostings = asyncHandler(async (req: Request, res: Response) => {
    const hostings = await hostingService.getAllHostings();
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, hostings));
});

const getHostingById = asyncHandler(async (req: Request, res: Response) => {
    const hosting = await hostingService.getHostingById(req.params.id);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, hosting));
});

const updateHosting = asyncHandler(async (req: Request, res: Response) => {
    const hosting = await hostingService.updateHosting(req.params.id, req.body);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, hosting, 'Hosting updated successfully'));
});

const deleteHosting = asyncHandler(async (req: Request, res: Response) => {
    await hostingService.deleteHosting(req.params.id);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, null, 'Hosting deleted successfully'));
});

export const hostingController = {
    createHosting,
    getAllHostings,
    getHostingById,
    updateHosting,
    deleteHosting,
};
