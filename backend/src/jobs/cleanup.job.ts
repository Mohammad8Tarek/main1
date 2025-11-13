
import fs from 'fs';
import path from 'path';
import prisma from '../database/prisma';
import logger from '../utils/logger';

export const cleanupUploads = async () => {
    try {
        // FIX: Cast process to any to resolve type error for 'cwd' due to missing Node.js types.
        const uploadsDir = path.join((process as any).cwd(), 'uploads');
        const filesInDir = fs.readdirSync(uploadsDir);

        const filesInDb = await prisma.upload.findMany({
            select: { filename: true },
        });
        const dbFilenames = new Set(filesInDb.map(f => f.filename));

        let deletedCount = 0;
        for (const filename of filesInDir) {
            if (!dbFilenames.has(filename)) {
                fs.unlinkSync(path.join(uploadsDir, filename));
                deletedCount++;
            }
        }
        if (deletedCount > 0) {
            logger.info(`Cleanup job deleted ${deletedCount} unused upload(s).`);
        } else {
            logger.info('Cleanup job ran, no unused uploads found.');
        }

    } catch (error) {
        logger.error('Error during upload cleanup job:', error);
    }
};