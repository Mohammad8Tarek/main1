
import prisma from '../../database/prisma';
import { Prisma, Assignment } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../../utils/apiError';
import logger from '../../utils/logger';

const createAssignment = async (data: { employeeId: string; roomId: string; checkInDate: string; expectedCheckOutDate?: string }): Promise<Assignment> => {
    // Check if employee and room exist
    const employee = await prisma.employee.findUnique({ where: { id: data.employeeId } });
    if (!employee) throw new ApiError(httpStatus.NOT_FOUND, 'Employee not found');
    const room = await prisma.room.findUnique({ where: { id: data.roomId } });
    if (!room) throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');

    // Check if employee is already assigned
    const existingAssignment = await prisma.assignment.findFirst({
        where: { employeeId: data.employeeId, checkOutDate: null }
    });
    if (existingAssignment) throw new ApiError(httpStatus.BAD_REQUEST, 'Employee is already assigned to a room');

    // Check room capacity
    if (room.currentOccupancy >= room.capacity) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Room is already at full capacity');
    }

    // Create assignment and update room occupancy
    const [assignment] = await prisma.$transaction([
        prisma.assignment.create({
            data: {
                ...data,
                checkInDate: new Date(data.checkInDate),
                expectedCheckOutDate: data.expectedCheckOutDate ? new Date(data.expectedCheckOutDate) : undefined,
            }
        }),
        prisma.room.update({
            where: { id: data.roomId },
            data: { currentOccupancy: { increment: 1 } }
        })
    ]);
    
    // Update room status if it's now full
    const updatedRoom = await prisma.room.findUnique({ where: { id: data.roomId }});
    if (updatedRoom && updatedRoom.currentOccupancy === updatedRoom.capacity) {
        await prisma.room.update({ where: { id: data.roomId }, data: { status: 'OCCUPIED' } });
    }

    logger.info(`Assigned employee ${data.employeeId} to room ${data.roomId}`);
    return assignment;
};

const getAllAssignments = async (): Promise<Assignment[]> => {
    return prisma.assignment.findMany({
        include: {
            employee: true,
            room: { include: { floor: { include: { building: true } } } }
        },
        orderBy: { checkInDate: 'desc' }
    });
};

const reassignEmployee = async (assignmentId: string, newRoomId: string) => {
    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment || assignment.checkOutDate) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Active assignment not found');
    }

    const oldRoom = await prisma.room.findUnique({ where: { id: assignment.roomId } });
    const newRoom = await prisma.room.findUnique({ where: { id: newRoomId } });
    if (!newRoom) throw new ApiError(httpStatus.NOT_FOUND, 'New room not found');
    if (newRoom.currentOccupancy >= newRoom.capacity) throw new ApiError(httpStatus.BAD_REQUEST, 'New room is at full capacity');

    // Perform reassignment in a transaction
    const [updatedAssignment] = await prisma.$transaction([
        prisma.assignment.update({
            where: { id: assignmentId },
            data: { roomId: newRoomId }
        }),
        prisma.room.update({
            where: { id: assignment.roomId },
            data: { currentOccupancy: { decrement: 1 }, status: 'AVAILABLE' } // Set old room status
        }),
        prisma.room.update({
            where: { id: newRoomId },
            data: {
                currentOccupancy: { increment: 1 },
                status: newRoom.currentOccupancy + 1 === newRoom.capacity ? 'OCCUPIED' : newRoom.status
            }
        })
    ]);

    logger.info(`Reassigned employee ${assignment.employeeId} from room ${assignment.roomId} to ${newRoomId}`);
    return { oldAssignment: assignment, newAssignment: updatedAssignment };
};

const checkoutEmployee = async (assignmentId: string, checkOutDate?: string): Promise<Assignment> => {
    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment || assignment.checkOutDate) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Active assignment not found');
    }
    
    const [updatedAssignment] = await prisma.$transaction([
        prisma.assignment.update({
            where: { id: assignmentId },
            data: { checkOutDate: checkOutDate ? new Date(checkOutDate) : new Date() }
        }),
        prisma.room.update({
            where: { id: assignment.roomId },
            data: { currentOccupancy: { decrement: 1 }, status: 'AVAILABLE' }
        })
    ]);
    
    logger.info(`Checked out employee ${assignment.employeeId} from room ${assignment.roomId}`);
    return updatedAssignment;
};

export const assignmentService = {
    createAssignment,
    getAllAssignments,
    reassignEmployee,
    checkoutEmployee,
};
