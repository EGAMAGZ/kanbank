import type { Id } from "../../shared/types/index.js";
import type { TimelineEntry } from "../entities/timeline-entry.entity.js";
export interface TimelineRepository {
    findByTask(taskId: Id<"Task">): Promise<TimelineEntry[]>;
    create(entry: TimelineEntry): Promise<Id<"TimelineEntry">>;
    deleteByTask(taskId: Id<"Task">): Promise<void>;
}
