import {
  isDueToday,
  localDay,
  wasUpdatedYesterday,
  watchAlerts,
} from "./watch.ts";
import type { Task } from "../../domain/entities/task.entity.ts";
import type { Id } from "../../shared/types/id.ts";

function check(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

function eq(actual: unknown, expected: unknown, msg: string): void {
  check(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${msg} — got ${JSON.stringify(actual)}`,
  );
}

const NOW = new Date(2026, 8, 29, 15, 0, 0);
const YESTERDAY = new Date(2026, 8, 28, 9, 0, 0);

function task(over: Partial<Task>): Task {
  return {
    id: "t1" as Id<"Task">,
    seq: 1,
    boardId: "b1" as Id<"Board">,
    stateId: "s1" as Id<"State">,
    title: "t",
    description: "",
    images: [],
    lastActivityAt: NOW.toISOString(),
    stateChangedAt: NOW.toISOString(),
    createdAt: NOW.toISOString(),
    updatedAt: YESTERDAY.toISOString(),
    pinned: false,
    watch: true,
    dueDate: null,
    notNowSince: null,
    isGold: false,
    category: "",
    subscriberIds: [],
    ...over,
  };
}

// bare YYYY-MM-DD resolves to its own local day, not a UTC-shifted one
eq(localDay(new Date("2026-09-29T12:00:00")), "2026-09-29", "localDay");
check(isDueToday(task({ dueDate: "2026-09-29" }), NOW), "bare due today");
check(!isDueToday(task({ dueDate: "2026-09-30" }), NOW), "not due tomorrow");
check(!isDueToday(task({ dueDate: null }), NOW), "no due date");
check(
  isDueToday(task({ dueDate: "2026-09-29T23:30:00" }), NOW),
  "iso due today",
);

check(wasUpdatedYesterday(task({}), NOW), "updated yesterday");
check(
  !wasUpdatedYesterday(task({ updatedAt: NOW.toISOString() }), NOW),
  "not updated today",
);
check(
  wasUpdatedYesterday(
    task({ updatedAt: new Date(2026, 8, 1, 8).toISOString() }),
    new Date(2026, 8, 2, 8),
  ),
  "month boundary",
);

eq(
  watchAlerts(task({ dueDate: "2026-09-29" }), NOW),
  ["due today", "updated yesterday"],
  "both alerts",
);
eq(watchAlerts(task({ dueDate: null }), NOW), ["updated yesterday"], "yesterday only");
eq(watchAlerts(task({ watch: false, dueDate: "2026-09-29" }), NOW), [], "unwatched");
eq(
  watchAlerts(task({ watch: false, updatedAt: YESTERDAY.toISOString() }), NOW),
  [],
  "unwatched yesterday",
);

console.log("watch checks passed");
