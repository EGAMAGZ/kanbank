import { parseOrThrow } from "../../validation.js";
import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import { type UpdateTaskInput, UpdateTaskSchema } from "../../dto/task.dto.js";
import {
  EntityNotFoundError,
} from "../../../domain/errors/domain-errors.js";
import { toISODate } from "../../../shared/utils/dates.js";
import { eventBus } from "../../../shared/events/event-bus.js";
import type { Id } from "../../../shared/types/id.js";

export class UpdateTaskUseCase {
  constructor(private taskRepo: TaskRepository) {}

  async execute(id: Id<"Task">, input: UpdateTaskInput): Promise<void> {
    const parsed = parseOrThrow(UpdateTaskSchema, input);

    const task = await this.taskRepo.findById(id);
    if (!task) {
      throw new EntityNotFoundError("Task", id);
    }

    const now = toISODate();
    const { stateId, ...rest } = parsed;
    const changes: Record<string, unknown> = {
      ...rest,
      lastActivityAt: now,
      updatedAt: now,
    };
    if (stateId !== undefined) {
      changes.stateId = stateId as Id<"State">;
    }
    await this.taskRepo.update(id, changes);

    eventBus.publish("task.updated", { id, ...parsed });
  }
}
