import { monthAgo } from "./dates.ts";

function eq(actual: unknown, expected: unknown, msg: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`FAIL: ${msg} — got ${a}, want ${e}`);
}

const day = (d: Date): string =>
  `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

const back = (y: number, m: number, d: number): string =>
  day(monthAgo(new Date(y, m - 1, d)));

eq(back(2026, 3, 15), "2026-2-15", "mid-month");
eq(back(2026, 12, 15), "2026-11-15", "year rollover");
eq(back(2026, 1, 31), "2025-12-31", "Jan 31 -> Dec 31");
eq(back(2026, 8, 31), "2026-7-31", "Aug 31 -> Jul 31");
eq(back(2026, 3, 31), "2026-2-28", "Mar 31 -> Feb 28, not Mar 3");
eq(back(2024, 3, 31), "2024-2-29", "Mar 31 -> Feb 29 in a leap year");

console.log("date checks passed");
