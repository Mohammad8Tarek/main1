
import { z } from 'zod';
import { Role, Status } from '@prisma/client';

const createUser = z.object({
  body: z.object({
    email: z.string().email(),
    username: z.string().min(3),
    password: z.string().min(6),
    role: z.nativeEnum(Role).optional(),
    status: z.nativeEnum(Status).optional(),
  }),
});

const getUser = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

const updateUser = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    email: z.string().email().optional(),
    username: z.string().min(3).optional(),
    password: z.string().min(6).optional(),
    role: z.nativeEnum(Role).optional(),
    status: z.nativeEnum(Status).optional(),
  }).min(1), // Ensure at least one field is being updated
});

const deleteUser = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

const changePassword = z.object({
    body: z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(6),
    })
});

export const userValidation = {
  createUser,
  getUser,
  updateUser,
  deleteUser,
  changePassword,
};