export function toISODate(date: Date = new Date()): string {
  return date.toISOString();
}

export function inactiveDays(lastActivityAt: string): number {
  const now = new Date();
  const lastActivity = new Date(lastActivityAt);
  const diffMs = now.getTime() - lastActivity.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
