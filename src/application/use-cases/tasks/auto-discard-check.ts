import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import { MoveTaskUseCase } from "./move-task.js";
import { getAutoDiscardDays } from "../../../shared/constants/defaults.js";
import { inactiveDays } from "../../../shared/utils/dates.js";
import type { Task } from "../../../domain/entities/task.entity.js";
import type { State } from "../../../domain/entities/state.entity.js";

export class AutoDiscardCheckUseCase {
  constructor(
    _taskRepo: TaskRepository,
    private moveTask: MoveTaskUseCase,
  ) {}

  async execute(
    tasks: Task[],
    states: State[],
  ): Promise<number> {
    const days = getAutoDiscardDays();
    if (days === null) return 0;

    const notNowState = states.find((s) => s.title === "Not now");
    if (!notNowState) return 0;

    const nonTerminalStateIds = new Set(
      states
        .filter((s) => s.title !== "Not now" && s.title !== "Done")
        .map((s) => s.id),
    );

    const candidates = tasks.filter(
      (t) =>
        nonTerminalStateIds.has(t.stateId) &&
        t.notNowSince === null &&
        inactiveDays(t.lastActivityAt) >= days,
    );

    for (const task of candidates) {
      await this.moveTask.execute(
        {
          taskId: task.id,
          newStateId: notNowState.id,
          order: 0,
        },
        { autoDiscard: true, targetIsNotNow: true },
      );
    }

    return candidates.length;
  }
}
