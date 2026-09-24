import type { Id } from "../../shared/types/id.js";
import type { TimelineEntry } from "../entities/timeline-entry.entity.js";

export interface TimelineRepository {
  findAll(): Promise<TimelineEntry[]>;
  findByTask(taskId: Id<"Task">): Promise<TimelineEntry[]>;
  create(entry: TimelineEntry): Promise<Id<"TimelineEntry">>;
  deleteByTask(taskId: Id<"Task">): Promise<void>;
}
