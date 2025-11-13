
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import asyncHandler from '../../utils/asyncHandler';
import { maintenanceService } from './maintenance.service';
import ApiResponse from '../../utils/apiResponse';

const createRequest = asyncHandler(async (req: Request, res: Response) => {
    const request = await maintenanceService.createRequest(req.body);
    res.status(httpStatus.CREATED).send(new ApiResponse(httpStatus.CREATED, request, 'Maintenance request created successfully'));
});

const getAllRequests = asyncHandler(async (req: Request, res: Response) => {
    const requests = await maintenanceService.getAllRequests();
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, requests));
});

const getRequestById = asyncHandler(async (req: Request, res: Response) => {
    const request = await maintenanceService.getRequestById(req.params.id);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, request));
});

const updateRequest = asyncHandler(async (req: Request, res: Response) => {
    const request = await maintenanceService.updateRequest(req.params.id, req.body);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, request, 'Maintenance request updated successfully'));
});

const deleteRequest = asyncHandler(async (req: Request, res: Response) => {
    await maintenanceService.deleteRequest(req.params.id);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, null, 'Maintenance request deleted successfully'));
});

export const maintenanceController = {
    createRequest,
    getAllRequests,
    getRequestById,
    updateRequest,
    deleteRequest,
};
