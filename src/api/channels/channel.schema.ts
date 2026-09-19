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

export const updateChannelSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(3)
        .max(64)
        .regex(/^[a-zA-Z0-9_-]+$/)
        .optional(),
      description: z.string().trim().max(500).nullish(),
    })
    .refine((data) => data.name !== undefined || data.description !== undefined, {
      message: 'Nothing to update',
    }),
  params: channelIdParam,
  query: z.object({}),
});

export const addMemberSchema = z.object({
  body: z.object({
    identifier: z.string().trim().min(1).max(255),
  }),
  params: channelIdParam,
  query: z.object({}),
});
