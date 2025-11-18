
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import asyncHandler from '../../utils/asyncHandler';
import { hostingService } from './hosting.service';
import ApiResponse from '../../utils/apiResponse';

const create = asyncHandler(async (req: Request, res: Response) => {
    const result = await hostingService.create(req.body);
    res.status(httpStatus.CREATED).send(new ApiResponse(httpStatus.CREATED, result, 'Hosting created'));
});

const getAll = asyncHandler(async (req: Request, res: Response) => {
    const results = await hostingService.getAll();
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, results));
});

const getById = asyncHandler(async (req: Request, res: Response) => {
    const result = await hostingService.getById(req.params.id);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, result));
});

const update = asyncHandler(async (req: Request, res: Response) => {
    const result = await hostingService.update(req.params.id, req.body);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, result, 'Hosting updated'));
});

const deleteById = asyncHandler(async (req: Request, res: Response) => {
    await hostingService.delete(req.params.id);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, null, 'Hosting deleted'));
});

export const hostingController = {
    create,
    getAll,
    getById,
    update,
    delete: deleteById,
};