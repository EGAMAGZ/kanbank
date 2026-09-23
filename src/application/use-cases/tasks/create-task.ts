import { parseOrThrow } from "../../validation.js";
import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import type { TimelineRepository } from "../../../domain/repositories/timeline.repository.js";
import { createTask } from "../../../domain/entities/task.entity.js";
import { createTimelineEntry } from "../../../domain/entities/timeline-entry.entity.js";
import { generateId } from "../../../shared/types/id.js";
import { toISODate } from "../../../shared/utils/dates.js";
import { eventBus } from "../../../shared/events/event-bus.js";
import { CURRENT_USER } from "../../../shared/constants/defaults.js";
import { type CreateTaskInput, CreateTaskSchema } from "../../dto/task.dto.js";

export class CreateTaskUseCase {
  constructor(
    private taskRepo: TaskRepository,
    private timelineRepo: TimelineRepository,
  ) {}

  async execute(input: CreateTaskInput): Promise<string> {
    const parsed = parseOrThrow(CreateTaskSchema, input);

    const now = toISODate();
    const taskId = generateId<"Task">();
    const seq = await this.taskRepo.getNextSeq();

    const task = createTask({
      id: taskId,
      seq,
      boardId: parsed.boardId,
      stateId: parsed.stateId,
      title: parsed.title,
      description: parsed.description,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await this.taskRepo.create(task);
    const entry = createTimelineEntry({
      id: generateId<"TimelineEntry">(),
      taskId,
      type: "created",
      userId: CURRENT_USER.initials,
      userName: CURRENT_USER.name,
      message: "added this card",
      timestamp: now,
    });
    await this.timelineRepo.create(entry);

    eventBus.publish("task.created", task);
    return taskId;
  }
}
