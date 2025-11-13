import { z } from 'zod';
import { HostingStatus } from '@prisma/client';

const createHosting = z.object({
  body: z.object({
    guestFirstName: z.string(),
    guestLastName: z.string(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    notes: z.string().optional().nullable(),
    guests: z.any(), // Assuming JSON
    status: z.nativeEnum(HostingStatus).optional(),
    employeeId: z.string().cuid(),
  }),
});

const getHosting = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

const updateHosting = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    guestFirstName: z.string().optional(),
    guestLastName: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    notes: z.string().optional().nullable(),
    guests: z.any().optional(),
    status: z.nativeEnum(HostingStatus).optional(),
  }).min(1),
});

const deleteHosting = getHosting;

export const hostingValidation = {
  createHosting,
  getHosting,
  updateHosting,
  deleteHosting,
};
