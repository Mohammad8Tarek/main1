
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import asyncHandler from '../../utils/asyncHandler';
import { employeeService } from './employee.service';
import ApiResponse from '../../utils/apiResponse';

const createEmployee = asyncHandler(async (req: Request, res: Response) => {
    const employee = await employeeService.createEmployee(req.body);
    res.status(httpStatus.CREATED).send(new ApiResponse(httpStatus.CREATED, employee, 'Employee created successfully'));
});

const getAllEmployees = asyncHandler(async (req: Request, res: Response) => {
    const employees = await employeeService.getAllEmployees();
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, employees));
});

const getEmployeeById = asyncHandler(async (req: Request, res: Response) => {
    const employee = await employeeService.getEmployeeById(req.params.id);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, employee));
});

const updateEmployee = asyncHandler(async (req: Request, res: Response) => {
    const employee = await employeeService.updateEmployee(req.params.id, req.body);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, employee, 'Employee updated successfully'));
});

const deleteEmployee = asyncHandler(async (req: Request, res: Response) => {
    await employeeService.deleteEmployee(req.params.id);
    res.status(httpStatus.OK).send(new ApiResponse(httpStatus.OK, null, 'Employee deleted successfully'));
});

export const employeeController = {
    createEmployee,
    getAllEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
};
