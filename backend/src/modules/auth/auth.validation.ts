import { z } from 'zod';

const login = z.object({
  body: z.object({
    username: z.string(),
    password: z.string(),
  }),
});

const refreshToken = z.object({
  body: z.object({
    refreshToken: z.string(),
  }),
});

export const authValidation = {
  login,
  refreshToken,
};
