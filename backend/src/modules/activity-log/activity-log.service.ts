
import prisma from '../../database/prisma';
import { ActivityLog } from '@prisma/client';

const getAllLogs = async (): Promise<ActivityLog[]> => {
    return prisma.activityLog.findMany({
        orderBy: { timestamp: 'desc' }
    });
};

const createLog = async (data: { username: string, action: string }): Promise<ActivityLog> => {
    // Find user to associate log with, but don't fail if it's a system action or user is not found
    const user = await prisma.user.findUnique({ where: { username: data.username }});
    
    return prisma.activityLog.create({
        data: {
            username: data.username,
            action: data.action,
            userId: user?.id, // Link to user if found
        }
    });
}

export const activityLogService = {
    getAllLogs,
    createLog
};