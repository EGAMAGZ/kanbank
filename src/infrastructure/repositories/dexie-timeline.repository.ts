import type { Id } from "../../shared/types/index.js";
import type { TimelineEntry } from "../../domain/entities/timeline-entry.entity.js";
import type { TimelineRepository } from "../../domain/repositories/timeline.repository.js";
import { db } from "../database/dexie-db.js";

export class DexieTimelineRepository implements TimelineRepository {
  async findByTask(taskId: Id<"Task">): Promise<TimelineEntry[]> {
    return db.timeline.where("taskId").equals(taskId).reverse().sortBy(
      "timestamp",
    );
  }

  async create(entry: TimelineEntry): Promise<Id<"TimelineEntry">> {
    await db.timeline.add(entry);
    return entry.id;
  }

  async deleteByTask(taskId: Id<"Task">): Promise<void> {
    await db.timeline.where("taskId").equals(taskId).delete();
  }
}
