
import { z } from 'zod';
import { RoomStatus } from '@prisma/client';

const createRoom = z.object({
  body: z.object({
    roomNumber: z.string(),
    capacity: z.number().int().positive(),
    floorId: z.string().cuid(),
    status: z.nativeEnum(RoomStatus).optional(),
  }),
});

const getRoom = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

const updateRoom = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    roomNumber: z.string().optional(),
    capacity: z.number().int().positive().optional(),
    status: z.nativeEnum(RoomStatus).optional(),
    currentOccupancy: z.number().int().min(0).optional(),
  }).min(1),
});

const deleteRoom = getRoom;

export const roomValidation = {
  createRoom,
  getRoom,
  updateRoom,
  deleteRoom,
};
