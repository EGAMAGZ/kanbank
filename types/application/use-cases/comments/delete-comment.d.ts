import type { CommentRepository } from '../../../domain/repositories/comment.repository.js';
import type { TaskRepository } from '../../../domain/repositories/task.repository.js';
import type { Id } from '../../../shared/types/index.js';
export declare class DeleteCommentUseCase {
    private commentRepo;
    private taskRepo;
    constructor(commentRepo: CommentRepository, taskRepo: TaskRepository);
    execute(id: Id<'Comment'>): Promise<void>;
}
