import type { CommentRepository } from "../../../domain/repositories/comment.repository.js";
import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import type { ImageRepository } from "../../../domain/repositories/image.repository.js";
import type { Id } from "../../../shared/types/index.js";
export declare class DetachImageCommentUseCase {
    private commentRepo;
    private taskRepo;
    private imageRepo;
    constructor(commentRepo: CommentRepository, taskRepo: TaskRepository, imageRepo: ImageRepository);
    execute(commentId: Id<"Comment">, imageId: Id<"Image">): Promise<void>;
}
