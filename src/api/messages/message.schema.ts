import { z } from 'zod';

export const sendMessageSchema = z.object({
  channelId: z.uuid(),
  content: z.string().trim().min(1).max(2000),
});

export const messageHistorySchema = z.object({
  channelId: z.uuid(),
  cursor: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
