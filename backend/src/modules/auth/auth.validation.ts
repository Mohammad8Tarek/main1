
import { z } from 'zod';

const register = z.object({
  body: z.object({
    email: z.string().email(),
    username: z.string().min(3),
    password: z.string().min(6),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'HR', 'MAINTENANCE', 'VIEWER']).optional(),
  }),
});

const login = z.object({
  body: z.object({
    identifier: z.string(),
    password: z.string(),
  }),
});

const refreshToken = z.object({
  body: z.object({
    refreshToken: z.string(),
  }),
});

export const authValidation = {
  register,
  login,
  refreshToken,
};
