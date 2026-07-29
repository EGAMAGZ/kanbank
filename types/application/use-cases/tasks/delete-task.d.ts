import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import type { CommentRepository } from "../../../domain/repositories/comment.repository.js";
import type { ImageRepository } from "../../../domain/repositories/image.repository.js";
import type { Id } from "../../../shared/types/index.js";
export declare class DeleteTaskUseCase {
    private taskRepo;
    private commentRepo;
    private imageRepo;
    constructor(taskRepo: TaskRepository, commentRepo: CommentRepository, imageRepo: ImageRepository);
    execute(id: Id<"Task">): Promise<void>;
}
