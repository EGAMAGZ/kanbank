import type { CommentRepository } from '../../../domain/repositories/comment.repository.js';
import type { TaskRepository } from '../../../domain/repositories/task.repository.js';
import { type UpdateCommentInput } from '../../dto/comment.dto.js';
import type { Id } from '../../../shared/types/index.js';
export declare class UpdateCommentUseCase {
    private commentRepo;
    private taskRepo;
    constructor(commentRepo: CommentRepository, taskRepo: TaskRepository);
    execute(id: Id<'Comment'>, input: UpdateCommentInput): Promise<void>;
}
