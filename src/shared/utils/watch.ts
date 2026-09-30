import type { Task } from "../../domain/entities/task.entity.js";

/** Mirrors the "due today / updated yesterday" rule applied by public/sw.js. */
export const WATCH_DUE_TODAY = "due today";
export const WATCH_UPDATED_YESTERDAY = "updated yesterday";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Local calendar day as YYYY-MM-DD (never UTC — avoids the off-by-one). */
export function localDay(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Bare YYYY-MM-DD gets T12:00:00 so the local day survives UTC parsing. */
function asLocalDate(dateStr: string): Date {
  return dateStr.includes("T")
    ? new Date(dateStr)
    : new Date(`${dateStr}T12:00:00`);
}

export function isDueToday(task: Task, now: Date = new Date()): boolean {
  if (!task.dueDate) return false;
  return localDay(asLocalDate(task.dueDate)) === localDay(now);
}

export function wasUpdatedYesterday(
  task: Task,
  now: Date = new Date(),
): boolean {
  const yesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
  );
  return localDay(new Date(task.updatedAt)) === localDay(yesterday);
}

/** Alert labels for a watched task; empty when nothing needs attention. */
export function watchAlerts(task: Task, now: Date = new Date()): string[] {
  if (!task.watch) return [];
  const alerts: string[] = [];
  if (isDueToday(task, now)) alerts.push(WATCH_DUE_TODAY);
  if (wasUpdatedYesterday(task, now)) alerts.push(WATCH_UPDATED_YESTERDAY);
  return alerts;
}
