import type { CommentRepository } from '../../../domain/repositories/comment.repository.js';
import type { TaskRepository } from '../../../domain/repositories/task.repository.js';
import { type AddCommentInput } from '../../dto/comment.dto.js';
export declare class AddCommentUseCase {
    private commentRepo;
    private taskRepo;
    constructor(commentRepo: CommentRepository, taskRepo: TaskRepository);
    execute(input: AddCommentInput): Promise<string>;
}
