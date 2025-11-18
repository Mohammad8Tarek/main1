
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import asyncHandler from '../../utils/asyncHandler';
import { activityLogService } from './activitylog.service';
import ApiResponse from '../../utils/apiResponse';

const getAllLogs = asyncHandler(async (req: Request, res: Response) => {
    const logs = await activityLogService.getAll();
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, logs));
});

const createLog = asyncHandler(async (req: Request, res: Response) => {
    const { username, action } = req.body;
    const log = await activityLogService.logActivity(username, action);
    res.status(httpStatus.CREATED).send(new ApiResponse(httpStatus.CREATED, log, 'Log created'));
});


export const activityLogController = {
    getAllLogs,
    createLog,
};
