import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import type { CommentRepository } from "../../../domain/repositories/comment.repository.js";
import type { Id } from "../../../shared/types/index.js";
export declare class DeleteTaskUseCase {
    private taskRepo;
    private commentRepo;
    constructor(taskRepo: TaskRepository, commentRepo: CommentRepository);
    execute(id: Id<"Task">): Promise<void>;
}
