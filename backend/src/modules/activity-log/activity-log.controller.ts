import { Request, Response } from 'express';
import httpStatus from 'http-status';
import asyncHandler from '../../utils/asyncHandler';
import { activityLogService } from './activity-log.service';
import ApiResponse from '../../utils/apiResponse';

const getAllLogs = asyncHandler(async (req: Request, res: Response) => {
    const logs = await activityLogService.getAllLogs();
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, logs));
});

const createLogEntry = asyncHandler(async (req: Request, res: Response) => {
    const log = await activityLogService.createLog(req.body);
    res.status(httpStatus.CREATED).send(new ApiResponse(httpStatus.CREATED, log));
});


export const activityLogController = {
    getAllLogs,
    createLogEntry
};
