
import { z } from 'zod';

const createLog = z.object({
  body: z.object({
    username: z.string(),
    action: z.string(),
  }),
});

export const activityLogValidation = {
  createLog,
};
