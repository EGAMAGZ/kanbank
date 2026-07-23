import type { CommentRepository } from '../../../domain/repositories/comment.repository.js';
import type { TaskRepository } from '../../../domain/repositories/task.repository.js';
import { createComment } from '../../../domain/entities/comment.entity.js';
import { generateId, toISODate } from '../../../shared/types/index.js';
import { eventBus } from '../../../shared/events/event-bus.js';
import { AddCommentSchema, type AddCommentInput } from '../../dto/comment.dto.js';
import { EntityNotFoundError, ValidationError } from '../../../domain/errors/domain-errors.js';

export class AddCommentUseCase {
  constructor(
    private commentRepo: CommentRepository,
    private taskRepo: TaskRepository,
  ) {}

  async execute(input: AddCommentInput): Promise<string> {
    const parsed = AddCommentSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map(i => i.message).join(', '));
    }

    const task = await this.taskRepo.findById(parsed.data.taskId as any);
    if (!task) {
      throw new EntityNotFoundError('Task', parsed.data.taskId);
    }

    const now = toISODate();
    const commentId = generateId<'Comment'>();

    const comment = createComment({
      id: commentId,
      taskId: parsed.data.taskId as any,
      markdown: parsed.data.markdown,
      createdAt: now,
      updatedAt: now,
    });

    await this.commentRepo.create(comment);

    await this.taskRepo.update(parsed.data.taskId as any, {
      lastActivityAt: now,
      updatedAt: now,
    });

    eventBus.publish('comment.created', comment);
    return commentId;
  }
}
