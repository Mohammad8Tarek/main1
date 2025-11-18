
import logger from '../../utils/logger';
import ApiError from '../../utils/apiError';
import httpStatus from 'http-status';

interface Reservation {
    id: string;
    [key: string]: any;
}

// In-memory store for reservations
let reservations: Reservation[] = [];
let idCounter = 0;

const create = async (data: Omit<Reservation, 'id'>): Promise<Reservation> => {
    idCounter++;
    const newReservation: Reservation = { id: idCounter.toString(), ...data };
    reservations.push(newReservation);
    logger.info(`Created in-memory reservation: ${newReservation.id}`);
    return newReservation;
};

const getAll = async (): Promise<Reservation[]> => {
    logger.info('Fetching in-memory reservations.');
    return [...reservations];
};

const getById = async (id: string): Promise<Reservation> => {
    const reservation = reservations.find(r => r.id === id);
    if (!reservation) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Reservation not found');
    }
    return reservation;
};

const update = async (id: string, updateData: Partial<Omit<Reservation, 'id'>>): Promise<Reservation> => {
    const index = reservations.findIndex(r => r.id === id);
    if (index === -1) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Reservation not found');
    }
    reservations[index] = { ...reservations[index], ...updateData };
    logger.info(`Updated in-memory reservation: ${id}`);
    return reservations[index];
};

const deleteById = async (id: string): Promise<void> => {
    const index = reservations.findIndex(r => r.id === id);
    if (index === -1) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Reservation not found');
    }
    reservations.splice(index, 1);
    logger.info(`Deleted in-memory reservation: ${id}`);
};

export const reservationService = {
    create,
    getAll,
    getById,
    update,
    delete: deleteById,
};