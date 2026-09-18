const connections = new Map<string, number>();

export function addConnection(userId: string): boolean {
  const count = connections.get(userId) ?? 0;
  connections.set(userId, count + 1);

  return count === 0;
}

export function removeConnection(userId: string): boolean {
  const count = connections.get(userId) ?? 0;

  if (count <= 1) {
    connections.delete(userId);
    return true;
  }

  connections.set(userId, count - 1);
  return false;
}

export function isOnline(userId: string): boolean {
  return (connections.get(userId) ?? 0) > 0;
}
