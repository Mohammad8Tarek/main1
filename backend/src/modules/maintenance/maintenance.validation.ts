
import { z } from 'zod';
import { MaintenanceStatus } from '@prisma/client';

const createRequest = z.object({
  body: z.object({
    roomId: z.string().cuid(),
    problemType: z.string(),
    description: z.string(),
    dueDate: z.string().datetime().optional(),
  }),
});

const getRequest = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

const updateRequest = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    problemType: z.string().optional(),
    description: z.string().optional(),
    status: z.nativeEnum(MaintenanceStatus).optional(),
    dueDate: z.string().datetime().optional().nullable(),
  }).min(1),
});

const deleteRequest = getRequest;

export const maintenanceValidation = {
  createRequest,
  getRequest,
  updateRequest,
  deleteRequest,
};
