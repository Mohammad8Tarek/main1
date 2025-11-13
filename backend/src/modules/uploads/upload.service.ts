
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import asyncHandler from '../../utils/asyncHandler';
import ApiResponse from '../../utils/apiResponse';
import prisma from '../../database/prisma';
import ApiError from '../../utils/apiError';
import logger from '../../utils/logger';

const handleEmployeePhotoUpload = asyncHandler(async (req: Request, res: Response) => {
    const employeeId = req.params.id;
    if (!req.file) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'No file uploaded');
    }

    const { filename, path, mimetype, size } = req.file;

    // Check if employee already has a photo
    const existingPhoto = await prisma.upload.findUnique({ where: { employeeId } });
    if (existingPhoto) {
        // Here you might want to delete the old file from storage
        await prisma.upload.delete({ where: { id: existingPhoto.id } });
    }

    const upload = await prisma.upload.create({
        data: {
            filename,
            path,
            mimetype,
            size,
            employeeId
        },
    });
    
    logger.info(`Uploaded photo for employee ID: ${employeeId}`);
    res.status(httpStatus.CREATED).send(new ApiResponse(httpStatus.CREATED, upload, 'Photo uploaded successfully'));
});

const handleRoomImageUpload = asyncHandler(async (req: Request, res: Response) => {
    const roomId = req.params.id;
     if (!req.file) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'No file uploaded');
    }

    const { filename, path, mimetype, size } = req.file;

    const upload = await prisma.upload.create({
        data: { filename, path, mimetype, size, roomId },
    });
    
    logger.info(`Uploaded image for room ID: ${roomId}`);
    res.status(httpStatus.CREATED).send(new ApiResponse(httpStatus.CREATED, upload, 'Image uploaded successfully'));
});


const handleMaintenanceImageUpload = asyncHandler(async (req: Request, res: Response) => {
    const maintenanceRequestId = req.params.id;
     if (!req.file) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'No file uploaded');
    }

    const { filename, path, mimetype, size } = req.file;

    const upload = await prisma.upload.create({
        data: { filename, path, mimetype, size, maintenanceRequestId },
    });
    
    logger.info(`Uploaded image for maintenance request ID: ${maintenanceRequestId}`);
    res.status(httpStatus.CREATED).send(new ApiResponse(httpStatus.CREATED, upload, 'Image uploaded successfully'));
});


const handleGenericUpload = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'No file uploaded');
    }
    const { filename, path, mimetype, size } = req.file;
    const upload = await prisma.upload.create({
        data: { filename, path, mimetype, size },
    });
    logger.info(`Uploaded generic file: ${filename}`);
    res.status(httpStatus.CREATED).send(new ApiResponse(httpStatus.CREATED, upload, 'File uploaded successfully'));
});

export const uploadService = {
    handleEmployeePhotoUpload,
    handleRoomImageUpload,
    handleMaintenanceImageUpload,
    handleGenericUpload
};
