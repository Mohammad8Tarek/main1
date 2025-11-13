
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger';
import config from '../config';

export const backupDatabase = () => {
    // FIX: Cast process to any to resolve type error for 'cwd' due to missing Node.js types.
    const backupDir = path.join((process as any).cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);

    const dbUrl = new URL(config.database_url);
    const dbUser = dbUrl.username;
    const dbPassword = dbUrl.password;
    const dbName = dbUrl.pathname.slice(1);
    const dbHost = dbUrl.hostname;
    const dbPort = dbUrl.port;

    const command = `PGPASSWORD="${dbPassword}" pg_dump -U ${dbUser} -h ${dbHost} -p ${dbPort} -d ${dbName} -f ${backupFile}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            logger.error(`Backup failed: ${error.message}`);
            return;
        }
        if (stderr) {
            logger.error(`Backup stderr: ${stderr}`);
            return;
        }
        logger.info(`Database backup successful: ${backupFile}`);
    });
};