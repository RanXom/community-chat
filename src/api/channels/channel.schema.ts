import z from 'zod';

const channelIdParam = z.object({
  channelId: z.uuid(),
});

export const createChannelSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(3)
      .max(64)
      .regex(/^[a-zA-Z0-9_-]+$/),
    description: z.string().trim().max(500).optional(),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const channelIdSchema = z.object({
  body: z.object({}),
  params: channelIdParam,
  query: z.object({}),
});
