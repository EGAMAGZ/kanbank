import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import { type UpdateTaskInput, UpdateTaskSchema } from "../../dto/task.dto.js";
import {
  EntityNotFoundError,
  ValidationError,
} from "../../../domain/errors/domain-errors.js";
import { toISODate } from "../../../shared/types/index.js";
import { eventBus } from "../../../shared/events/event-bus.js";
import type { Id } from "../../../shared/types/index.js";

export class UpdateTaskUseCase {
  constructor(private taskRepo: TaskRepository) {}

  async execute(id: Id<"Task">, input: UpdateTaskInput): Promise<void> {
    const parsed = UpdateTaskSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((i) => i.message).join(", "),
      );
    }

    const task = await this.taskRepo.findById(id);
    if (!task) {
      throw new EntityNotFoundError("Task", id);
    }

    const now = toISODate();
    await this.taskRepo.update(id, {
      ...parsed.data,
      stateId: parsed.data.stateId
        ? (parsed.data.stateId as Id<"State">)
        : undefined,
      lastActivityAt: now,
      updatedAt: now,
    });

    eventBus.publish("task.updated", { id, ...parsed.data });
  }
}
