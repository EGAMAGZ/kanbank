import { Dexie, type EntityTable } from "dexie";
import type { Board } from "../../domain/entities/board.entity.js";
import type { State } from "../../domain/entities/state.entity.js";
import type { Task } from "../../domain/entities/task.entity.js";
import type { Comment } from "../../domain/entities/comment.entity.js";
import type { Step } from "../../domain/entities/step.entity.js";
import type { TimelineEntry } from "../../domain/entities/timeline-entry.entity.js";
export interface ImageRecord {
  id: string;
  blob: Blob;
  filename: string;
  mimeType: string;
  size: number;
}

export const db = new Dexie("KanbankDB") as Dexie & {
  boards: EntityTable<Board, "id">;
  states: EntityTable<State, "id">;
  tasks: EntityTable<Task, "id">;
  comments: EntityTable<Comment, "id">;
  images: EntityTable<ImageRecord, "id">;
  steps: EntityTable<Step, "id">;
  timeline: EntityTable<TimelineEntry, "id">;
};

db.version(1).stores({
  boards: "++id",
  states: "++id, boardId, [boardId+order]",
  tasks: "++id, boardId, stateId, lastActivityAt, [boardId+stateId]",
  comments: "++id, taskId",
  images: "++id",
});

db.version(2).stores({}).upgrade((tx) => {
  return tx.table("states").toCollection().modify((s) => {
    s.color = s.color ?? "#0066cc";
  });
});

db.version(3).stores({}).upgrade((tx) => {
  return tx.table("tasks").toCollection().modify((t) => {
    t.pinned = false;
    t.dueDate = null;
    t.notNowSince = null;
    t.isGold = false;
  });
});

db.version(4).stores({
  tasks: "++id, boardId, stateId, lastActivityAt, pinned, [boardId+stateId]",
});

db.version(5).stores({
  tasks: "++id, boardId, stateId, lastActivityAt, pinned, [boardId+stateId]",
  steps: "++id, taskId",
  timeline: "++id, taskId",
}).upgrade((tx) => {
  return Promise.all([
    tx.table("boards").toCollection().modify((b: any) => {
      b.autoCloseDays = b.autoCloseDays ?? 7;
      b.autoCloseEnabled = b.autoCloseEnabled ?? false;
      b.publicLink = b.publicLink ?? false;
      b.accessControl = b.accessControl ?? "everyone";
    }),
    tx.table("tasks").toCollection().modify((t: any) => {
      t.category = t.category ?? "";
      t.subscriberIds = t.subscriberIds ?? [];
    }),
  ]);
});

db.version(6).stores({
  tasks:
    "++id, seq, boardId, stateId, lastActivityAt, pinned, [boardId+stateId]",
  steps: "++id, taskId",
  timeline: "++id, taskId",
}).upgrade(async (tx) => {
  const tasks = await tx.table("tasks").toArray();
  tasks.sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  let seq = 0;
  for (const t of tasks) {
    seq++;
    await tx.table("tasks").update(t.id, { seq });
  }
});
