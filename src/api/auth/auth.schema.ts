import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    username: z
      .string()
      .trim()
      .min(3)
      .max(32)
      .regex(/^[a-zA-Z0-9_]+$/),
    email: z.string().trim().email().max(254),
    password: z.string().min(8).max(128),
  }),
  params: z.object({}),
  query: z.object({}),
});
