
import { z } from 'zod';

const updateSettings = z.object({
  body: z.object({
    default_language: z.enum(['en', 'ar']).optional(),
    ai_suggestions: z.enum(['true', 'false']).optional(),
  }).min(1),
});

export const settingsValidation = {
  updateSettings,
};
