import type { Id } from "../../shared/types/index.js";
import type { TimelineEntry } from "../../domain/entities/timeline-entry.entity.js";
import type { TimelineRepository } from "../../domain/repositories/timeline.repository.js";
export declare class DexieTimelineRepository implements TimelineRepository {
  findByTask(taskId: Id<"Task">): Promise<TimelineEntry[]>;
  create(entry: TimelineEntry): Promise<Id<"TimelineEntry">>;
  deleteByTask(taskId: Id<"Task">): Promise<void>;
}
