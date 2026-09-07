import type { Id } from "../../shared/types/id.js";

export interface TimelineEntry {
  id: Id<"TimelineEntry">;
  taskId: Id<"Task">;
  type:
    | "created"
    | "moved"
    | "updated"
    | "commented"
    | "completed"
    | "auto-closed"
    | "gold-toggled"
    | "pinned"
    | "subscribed";
  fromStateId?: Id<"State">;
  toStateId?: Id<"State">;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

export interface CreateTimelineEntryData {
  id: Id<"TimelineEntry">;
  taskId: Id<"Task">;
  type: TimelineEntry["type"];
  fromStateId?: Id<"State">;
  toStateId?: Id<"State">;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

export function createTimelineEntry(
  data: CreateTimelineEntryData,
): TimelineEntry {
  return {
    id: data.id,
    taskId: data.taskId,
    type: data.type,
    fromStateId: data.fromStateId,
    toStateId: data.toStateId,
    userId: data.userId,
    userName: data.userName,
    message: data.message,
    timestamp: data.timestamp,
  };
}
