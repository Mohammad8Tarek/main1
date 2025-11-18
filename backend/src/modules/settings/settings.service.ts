
import logger from '../../utils/logger';

// In-memory store for settings as a mock since we can't alter the DB schema.
let settings: { [key: string]: string } = {
    default_language: 'en',
    ai_suggestions: 'true',
    last_backup_time: new Date().toISOString(),
};

const getSettings = async (): Promise<{ [key: string]: string }> => {
    logger.info('Fetching in-memory settings.');
    return Promise.resolve(settings);
};

const updateSettings = async (newSettings: { [key: string]: string }): Promise<{ [key: string]: string }> => {
    settings = { ...settings, ...newSettings };
    logger.info('Updating in-memory settings.');
    return Promise.resolve(settings);
};

export const settingsService = {
    getSettings,
    updateSettings,
};
