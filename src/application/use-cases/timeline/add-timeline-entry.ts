import {
  type CreateTimelineEntryInput,
  CreateTimelineEntrySchema,
} from "../../dto/timeline.dto.js";
import { ValidationError } from "../../../domain/errors/domain-errors.js";
import type { TimelineRepository } from "../../../domain/repositories/timeline.repository.js";
import { createTimelineEntry } from "../../../domain/entities/timeline-entry.entity.js";
import { generateId, toISODate } from "../../../shared/types/index.js";
import { eventBus } from "../../../shared/events/event-bus.js";

export class AddTimelineEntryUseCase {
  constructor(private timelineRepo: TimelineRepository) {}

  async execute(input: CreateTimelineEntryInput): Promise<string> {
    const parsed = CreateTimelineEntrySchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((i) => i.message).join(", "),
      );
    }
    const entry = createTimelineEntry({
      id: generateId(),
      taskId: parsed.data.taskId as any,
      type: parsed.data.type,
      fromStateId: parsed.data.fromStateId as any,
      toStateId: parsed.data.toStateId as any,
      userId: parsed.data.userId,
      userName: parsed.data.userName,
      message: parsed.data.message,
      timestamp: toISODate(),
    });
    const id = await this.timelineRepo.create(entry);
    eventBus.publish("timeline.added", entry);
    return id;
  }
}
