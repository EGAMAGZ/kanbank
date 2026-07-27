export const MANDATORY_STATES = ["Not now", "Maybe?", "Done"] as const;

export const LOCAL_STORAGE_KEYS = {
  lastOpenedBoard: "kanbank:lastOpenedBoard",
  preferences: "kanbank:preferences",
  autoDiscardDays: "kanbank:autoDiscardDays",
} as const;

export function getAutoDiscardDays(): number | null {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.autoDiscardDays);
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function setAutoDiscardDays(days: number | null): void {
  if (days === null) {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.autoDiscardDays);
  } else {
    localStorage.setItem(LOCAL_STORAGE_KEYS.autoDiscardDays, String(days));
  }
}
