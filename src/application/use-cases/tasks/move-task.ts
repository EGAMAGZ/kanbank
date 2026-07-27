import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import { type MoveTaskInput, MoveTaskSchema } from "../../dto/task.dto.js";
import {
  EntityNotFoundError,
  ValidationError,
} from "../../../domain/errors/domain-errors.js";
import { toISODate } from "../../../shared/types/index.js";
import { eventBus } from "../../../shared/events/event-bus.js";

export interface MoveTaskOptions {
  autoDiscard?: boolean;
  targetIsNotNow?: boolean;
}

export class MoveTaskUseCase {
  constructor(private taskRepo: TaskRepository) {}

  async execute(input: MoveTaskInput, options?: MoveTaskOptions): Promise<void> {
    const parsed = MoveTaskSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((i) => i.message).join(", "),
      );
    }

    const task = await this.taskRepo.findById(parsed.data.taskId as any);
    if (!task) {
      throw new EntityNotFoundError("Task", parsed.data.taskId);
    }

    const now = toISODate();
    const stateChanged = parsed.data.newStateId !== task.stateId;
    const targetIsNotNow = options?.targetIsNotNow ?? false;

    const taskUpdate: Record<string, unknown> = {
      lastActivityAt: now,
      updatedAt: now,
    };

    if (stateChanged && targetIsNotNow && options?.autoDiscard) {
      taskUpdate.notNowSince = now;
    } else if (stateChanged && !targetIsNotNow) {
      taskUpdate.notNowSince = null;
    }

    await this.taskRepo.move(
      parsed.data.taskId as any,
      parsed.data.newStateId as any,
      parsed.data.order,
    );

    await this.taskRepo.update(parsed.data.taskId as any, taskUpdate);

    eventBus.publish("task.moved", {
      taskId: parsed.data.taskId,
      fromStateId: task.stateId,
      toStateId: parsed.data.newStateId,
      order: parsed.data.order,
    });
  }
}
