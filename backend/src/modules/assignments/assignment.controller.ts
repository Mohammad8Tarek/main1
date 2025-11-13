
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import asyncHandler from '../../utils/asyncHandler';
import { assignmentService } from './assignment.service';
import ApiResponse from '../../utils/apiResponse';

const createAssignment = asyncHandler(async (req: Request, res: Response) => {
    const assignment = await assignmentService.createAssignment(req.body);
    res.status(httpStatus.CREATED).send(new ApiResponse(httpStatus.CREATED, assignment, 'Assignment created successfully'));
});

const getAllAssignments = asyncHandler(async (req: Request, res: Response) => {
    const assignments = await assignmentService.getAllAssignments();
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, assignments));
});

const reassignEmployee = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { newRoomId } = req.body;
    const result = await assignmentService.reassignEmployee(id, newRoomId);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, result, 'Employee reassigned successfully'));
});

const checkoutEmployee = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { checkOutDate } = req.body;
    const assignment = await assignmentService.checkoutEmployee(id, checkOutDate);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, assignment, 'Employee checked out successfully'));
});

export const assignmentController = {
    createAssignment,
    getAllAssignments,
    reassignEmployee,
    checkoutEmployee,
};
