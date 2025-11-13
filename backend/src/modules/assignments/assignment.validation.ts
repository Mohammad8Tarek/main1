
import { z } from 'zod';

const createAssignment = z.object({
  body: z.object({
    employeeId: z.string().cuid(),
    roomId: z.string().cuid(),
    checkInDate: z.string().datetime(),
    expectedCheckOutDate: z.string().datetime().optional(),
  }),
});

const reassign = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    newRoomId: z.string().cuid(),
  }),
});

const checkout = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    checkOutDate: z.string().datetime().optional(),
  }),
});


export const assignmentValidation = {
  createAssignment,
  reassign,
  checkout,
};
