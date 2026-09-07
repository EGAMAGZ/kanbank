import { parseOrThrow } from "../../validation.js";
import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import { type MoveTaskInput, MoveTaskSchema } from "../../dto/task.dto.js";
import {
  EntityNotFoundError,
} from "../../../domain/errors/domain-errors.js";
import { toISODate } from "../../../shared/utils/dates.js";
import { eventBus } from "../../../shared/events/event-bus.js";

export interface MoveTaskOptions {
  autoDiscard?: boolean;
  targetIsNotNow?: boolean;
}

export class MoveTaskUseCase {
  constructor(private taskRepo: TaskRepository) {}

  async execute(
    input: MoveTaskInput,
    options?: MoveTaskOptions,
  ): Promise<void> {
    const parsed = parseOrThrow(MoveTaskSchema, input);

    const task = await this.taskRepo.findById(parsed.taskId);
    if (!task) {
      throw new EntityNotFoundError("Task", parsed.taskId);
    }

    const now = toISODate();
    const stateChanged = parsed.newStateId !== task.stateId;
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
      parsed.taskId,
      parsed.newStateId,
      parsed.order,
    );

    await this.taskRepo.update(parsed.taskId, taskUpdate);

    eventBus.publish("task.moved", {
      taskId: parsed.taskId,
      fromStateId: task.stateId,
      toStateId: parsed.newStateId,
      order: parsed.order,
    });
  }
}
