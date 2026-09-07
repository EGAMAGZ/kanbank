import { parseOrThrow } from "../../validation.js";
import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import { createTask } from "../../../domain/entities/task.entity.js";
import { generateId } from "../../../shared/types/id.js";
import { toISODate } from "../../../shared/utils/dates.js";
import { eventBus } from "../../../shared/events/event-bus.js";
import { type CreateTaskInput, CreateTaskSchema } from "../../dto/task.dto.js";

export class CreateTaskUseCase {
  constructor(private taskRepo: TaskRepository) {}

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
    eventBus.publish("task.created", task);
    return taskId;
  }
}
