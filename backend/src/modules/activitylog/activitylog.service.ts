
import logger from '../../utils/logger';

interface ActivityLog {
    id: number;
    username: string;
    action: string;
    timestamp: string;
}

// In-memory store for logs as a mock.
let logs: ActivityLog[] = [ 
    { id: 1, username: 'system', action: 'Backend server started', timestamp: new Date().toISOString() }
];
let idCounter = 1;

const getAll = async (): Promise<ActivityLog[]> => {
    logger.info('Fetching in-memory activity logs.');
    return Promise.resolve(logs);
};

const logActivity = async (username: string, action: string): Promise<ActivityLog> => {
    idCounter++;
    const newLog: ActivityLog = { id: idCounter, username, action, timestamp: new Date().toISOString() };
    logs.unshift(newLog); // Add to the beginning
    if (logs.length > 200) {
        logs.pop(); // Limit array size to prevent memory leak
    }
    logger.info(`Activity Logged: [${username}] ${action}`);
    return Promise.resolve(newLog);
};

export const activityLogService = {
    getAll,
    logActivity,
};
