import { z } from 'zod';

const createReservation = z.object({
  body: z.object({
    firstName: z.string(),
    lastName: z.string(),
    checkInDate: z.string().datetime(),
    checkOutDate: z.string().datetime().optional().nullable(),
    notes: z.string().optional().nullable(),
    guestIdCardNumber: z.string(),
    guestPhone: z.string(),
    jobTitle: z.string(),
    department: z.string(),
    guests: z.any(), // Assuming JSON, can be refined with z.array(z.object(...)) if structure is known
    roomId: z.string().cuid(),
  }),
});

const getReservation = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

const updateReservation = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    checkInDate: z.string().datetime().optional(),
    checkOutDate: z.string().datetime().optional().nullable(),
    notes: z.string().optional().nullable(),
    guestIdCardNumber: z.string().optional(),
    guestPhone: z.string().optional(),
    jobTitle: z.string().optional(),
    department: z.string().optional(),
    guests: z.any().optional(),
    roomId: z.string().cuid().optional(),
  }).min(1),
});

const deleteReservation = getReservation;

export const reservationValidation = {
  createReservation,
  getReservation,
  updateReservation,
  deleteReservation,
};
