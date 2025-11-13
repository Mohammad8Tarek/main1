
import { z } from 'zod';
import { Status } from '@prisma/client';

// Building Schemas
const createBuilding = z.object({
  body: z.object({
    name: z.string(),
    location: z.string().optional(),
    status: z.nativeEnum(Status).optional(),
  }),
});

const getBuilding = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

const updateBuilding = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    name: z.string().optional(),
    location: z.string().optional(),
    status: z.nativeEnum(Status).optional(),
  }).min(1),
});

const deleteBuilding = getBuilding;

// Floor Schemas
const createFloor = z.object({
  params: z.object({
    id: z.string().cuid(), // buildingId
  }),
  body: z.object({
    floorNumber: z.string(),
    description: z.string().optional(),
  }),
});

const getFloor = z.object({
  params: z.object({
    floorId: z.string().cuid(),
  }),
});

const updateFloor = z.object({
  params: z.object({
    floorId: z.string().cuid(),
  }),
  body: z.object({
    floorNumber: z.string().optional(),
    description: z.string().optional(),
  }).min(1),
});

const deleteFloor = getFloor;


export const buildingValidation = {
  createBuilding,
  getBuilding,
  updateBuilding,
  deleteBuilding,
  createFloor,
  getFloor,
  updateFloor,
  deleteFloor,
};
