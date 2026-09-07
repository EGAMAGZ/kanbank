import type { BoardRepository } from "../../../domain/repositories/board.repository.js";
import type { StateRepository } from "../../../domain/repositories/state.repository.js";
import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import { EntityNotFoundError } from "../../../domain/errors/domain-errors.js";
import type { Id } from "../../../shared/types/id.js";
import type { Board } from "../../../domain/entities/board.entity.js";
import type { State } from "../../../domain/entities/state.entity.js";
import type { Task } from "../../../domain/entities/task.entity.js";

export interface BoardDetail {
  board: Board;
  states: State[];
  tasks: Task[];
  taskCounts: Record<string, number>;
}

export class GetBoardUseCase {
  constructor(
    private boardRepo: BoardRepository,
    private stateRepo: StateRepository,
    private taskRepo: TaskRepository,
  ) {}

  async execute(id: Id<"Board">): Promise<BoardDetail> {
    const board = await this.boardRepo.findById(id);
    if (!board) {
      throw new EntityNotFoundError("Board", id);
    }

    const states = await this.stateRepo.findByBoard(id);
    const tasks = await this.taskRepo.findByBoard(id);

    const taskCounts: Record<string, number> = {};
    for (const state of states) {
      taskCounts[state.id] = 0;
    }
    for (const task of tasks) {
      taskCounts[task.stateId] = (taskCounts[task.stateId] ?? 0) + 1;
    }

    return {
      board,
      states: states.sort((a, b) => a.order - b.order),
      tasks,
      taskCounts,
    };
  }
}
