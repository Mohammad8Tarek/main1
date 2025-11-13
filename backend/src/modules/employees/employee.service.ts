
import prisma from '../../database/prisma';
import { Prisma, Employee } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../../utils/apiError';
import logger from '../../utils/logger';

const createEmployee = async (employeeData: Prisma.EmployeeCreateInput): Promise<Employee> => {
    const existing = await prisma.employee.findFirst({
        where: { OR: [{ employeeId: employeeData.employeeId }, { nationalId: employeeData.nationalId }] }
    });
    if (existing) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Employee with this ID or National ID already exists.');
    }
    const employee = await prisma.employee.create({ data: employeeData });
    logger.info(`Created employee: ${employee.firstName} ${employee.lastName} (${employee.employeeId})`);
    return employee;
};

const getAllEmployees = async (): Promise<Employee[]> => {
    return prisma.employee.findMany({ include: { photo: true } });
};

const getEmployeeById = async (id: string): Promise<Employee> => {
    const employee = await prisma.employee.findUnique({
        where: { id },
        include: { photo: true, assignments: { include: { room: true } } }
    });
    if (!employee) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Employee not found');
    }
    return employee;
};

const updateEmployee = async (id: string, updateData: Prisma.EmployeeUpdateInput): Promise<Employee> => {
    await getEmployeeById(id); // Check if exists
    const updatedEmployee = await prisma.employee.update({ where: { id }, data: updateData });
    logger.info(`Updated employee: ${updatedEmployee.firstName} ${updatedEmployee.lastName} (${updatedEmployee.employeeId})`);
    return updatedEmployee;
};

const deleteEmployee = async (id: string): Promise<void> => {
    const employee = await getEmployeeById(id);
    const activeAssignment = await prisma.assignment.findFirst({
        where: { employeeId: id, checkOutDate: null }
    });
    if (activeAssignment) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete employee with an active assignment.');
    }
    await prisma.employee.delete({ where: { id } });
    logger.info(`Deleted employee: ${employee.firstName} ${employee.lastName} (${employee.employeeId})`);
};

export const employeeService = {
    createEmployee,
    getAllEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
};
