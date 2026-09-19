const MAX_MESSAGES = 3;
const WINDOW_MS = 3_000;

const messageTimestamps = new Map<string, number[]>();

export function allowMessages(userId: string): boolean {
  const now = Date.now();
  const timestamps = messageTimestamps.get(userId) ?? [];

  const recent = timestamps.filter((timestamps) => now - timestamps < WINDOW_MS);

  if (recent.length >= MAX_MESSAGES) {
    messageTimestamps.set(userId, recent);
    return false;
  }

  recent.push(now);
  messageTimestamps.set(userId, recent);

  return true;
}
