
import cron from 'node-cron';
import logger from '../utils/logger';
import { backupDatabase } from './backup.job';
import { cleanupUploads } from './cleanup.job';

export const initializeCronJobs = () => {
    // Schedule daily database backup at 2:00 AM
    cron.schedule('0 2 * * *', () => {
        logger.info('Running daily database backup cron job...');
        backupDatabase();
    });

    // Schedule daily cleanup of unused uploads at 3:00 AM
    cron.schedule('0 3 * * *', () => {
        logger.info('Running daily cleanup of unused uploads cron job...');
        cleanupUploads();
    });

    logger.info('Cron jobs initialized.');
};
