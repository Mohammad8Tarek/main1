
import logger from '../../utils/logger';
import ApiError from '../../utils/apiError';
import httpStatus from 'http-status';

interface Hosting {
    id: string;
    [key: string]: any;
}

// In-memory store for hostings
let hostings: Hosting[] = [];
let idCounter = 0;

const create = async (data: Omit<Hosting, 'id'>): Promise<Hosting> => {
    idCounter++;
    const newHosting: Hosting = { id: idCounter.toString(), ...data };
    hostings.push(newHosting);
    logger.info(`Created in-memory hosting: ${newHosting.id}`);
    return newHosting;
};

const getAll = async (): Promise<Hosting[]> => {
    logger.info('Fetching in-memory hostings.');
    return [...hostings];
};

const getById = async (id: string): Promise<Hosting> => {
    const hosting = hostings.find(h => h.id === id);
    if (!hosting) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Hosting not found');
    }
    return hosting;
};

const update = async (id: string, updateData: Partial<Omit<Hosting, 'id'>>): Promise<Hosting> => {
    const index = hostings.findIndex(h => h.id === id);
    if (index === -1) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Hosting not found');
    }
    hostings[index] = { ...hostings[index], ...updateData };
    logger.info(`Updated in-memory hosting: ${id}`);
    return hostings[index];
};

const deleteById = async (id: string): Promise<void> => {
    const index = hostings.findIndex(h => h.id === id);
    if (index === -1) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Hosting not found');
    }
    hostings.splice(index, 1);
    logger.info(`Deleted in-memory hosting: ${id}`);
};

export const hostingService = {
    create,
    getAll,
    getById,
    update,
    delete: deleteById,
};