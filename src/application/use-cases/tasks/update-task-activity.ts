import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import { EntityNotFoundError } from "../../../domain/errors/domain-errors.js";
import { toISODate } from "../../../shared/utils/dates.js";
import { eventBus } from "../../../shared/events/event-bus.js";
import type { Id } from "../../../shared/types/id.js";

export class UpdateTaskActivityUseCase {
  constructor(private taskRepo: TaskRepository) {}

  async execute(id: Id<"Task">): Promise<void> {
    const task = await this.taskRepo.findById(id);
    if (!task) {
      throw new EntityNotFoundError("Task", id);
    }

    const now = toISODate();
    await this.taskRepo.update(id, {
      lastActivityAt: now,
      updatedAt: now,
    });

    eventBus.publish("task.activity.updated", { taskId: id });
  }
}
