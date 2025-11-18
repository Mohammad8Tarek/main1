
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import asyncHandler from '../../utils/asyncHandler';
import { settingsService } from './settings.service';
import ApiResponse from '../../utils/apiResponse';

const getSettings = asyncHandler(async (req: Request, res: Response) => {
    const settings = await settingsService.getSettings();
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, settings));
});

const updateSettings = asyncHandler(async (req: Request, res: Response) => {
    const settings = await settingsService.updateSettings(req.body);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, settings, 'Settings updated successfully'));
});

export const settingsController = {
    getSettings,
    updateSettings,
};
