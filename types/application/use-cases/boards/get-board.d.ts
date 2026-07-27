import type { BoardRepository } from "../../../domain/repositories/board.repository.js";
import type { StateRepository } from "../../../domain/repositories/state.repository.js";
import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import type { Id } from "../../../shared/types/index.js";
import type { Board } from "../../../domain/entities/board.entity.js";
import type { State } from "../../../domain/entities/state.entity.js";
import type { Task } from "../../../domain/entities/task.entity.js";
export interface BoardDetail {
    board: Board;
    states: State[];
    tasks: Task[];
    taskCounts: Record<string, number>;
}
export declare class GetBoardUseCase {
    private boardRepo;
    private stateRepo;
    private taskRepo;
    constructor(boardRepo: BoardRepository, stateRepo: StateRepository, taskRepo: TaskRepository);
    execute(id: Id<"Board">): Promise<BoardDetail>;
}
