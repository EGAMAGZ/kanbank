import type { BoardRepository } from "../../../domain/repositories/board.repository.js";
import type { StateRepository } from "../../../domain/repositories/state.repository.js";
import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import type { CommentRepository } from "../../../domain/repositories/comment.repository.js";
import type { Id } from "../../../shared/types/index.js";
export declare class DeleteBoardUseCase {
    private boardRepo;
    private stateRepo;
    private taskRepo;
    private commentRepo;
    constructor(boardRepo: BoardRepository, stateRepo: StateRepository, taskRepo: TaskRepository, commentRepo: CommentRepository);
    execute(id: Id<"Board">): Promise<void>;
}
