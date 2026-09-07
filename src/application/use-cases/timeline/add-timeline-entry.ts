import { parseOrThrow } from "../../validation.js";
import {
  type CreateTimelineEntryInput,
  CreateTimelineEntrySchema,
} from "../../dto/timeline.dto.js";
import type { TimelineRepository } from "../../../domain/repositories/timeline.repository.js";
import { createTimelineEntry } from "../../../domain/entities/timeline-entry.entity.js";
import { generateId } from "../../../shared/types/id.js";
import { toISODate } from "../../../shared/utils/dates.js";
import { eventBus } from "../../../shared/events/event-bus.js";

export class AddTimelineEntryUseCase {
  constructor(private timelineRepo: TimelineRepository) {}

  async execute(input: CreateTimelineEntryInput): Promise<string> {
    const parsed = parseOrThrow(CreateTimelineEntrySchema, input);
    const entry = createTimelineEntry({
      id: generateId(),
      taskId: parsed.taskId,
      type: parsed.type,
      fromStateId: parsed.fromStateId,
      toStateId: parsed.toStateId,
      userId: parsed.userId,
      userName: parsed.userName,
      message: parsed.message,
      timestamp: toISODate(),
    });
    const id = await this.timelineRepo.create(entry);
    eventBus.publish("timeline.added", entry);
    return id;
  }
}
