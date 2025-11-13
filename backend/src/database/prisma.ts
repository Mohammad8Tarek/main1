import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient({
    log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
    ],
});

prisma.$on('query', (e) => {
    if (process.env.NODE_ENV === 'development') {
        // logger.info(`Query: ${e.query}`);
        // logger.info(`Params: ${e.params}`);
        // logger.info(`Duration: ${e.duration}ms`);
    }
});

prisma.$on('info', (e) => {
  logger.info(e.message);
});

prisma.$on('warn', (e) => {
  logger.warn(e.message);
});

prisma.$on('error', (e) => {
  logger.error(e.message);
});

export default prisma;
