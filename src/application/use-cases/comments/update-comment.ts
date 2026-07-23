import type { CommentRepository } from '../../../domain/repositories/comment.repository.js';
import type { TaskRepository } from '../../../domain/repositories/task.repository.js';
import { UpdateCommentSchema, type UpdateCommentInput } from '../../dto/comment.dto.js';
import { EntityNotFoundError, ValidationError } from '../../../domain/errors/domain-errors.js';
import { toISODate } from '../../../shared/types/index.js';
import { eventBus } from '../../../shared/events/event-bus.js';
import type { Id } from '../../../shared/types/index.js';

export class UpdateCommentUseCase {
  constructor(
    private commentRepo: CommentRepository,
    private taskRepo: TaskRepository,
  ) {}

  async execute(id: Id<'Comment'>, input: UpdateCommentInput): Promise<void> {
    const parsed = UpdateCommentSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map(i => i.message).join(', '));
    }

    const comment = await this.commentRepo.findById(id);
    if (!comment) {
      throw new EntityNotFoundError('Comment', id);
    }

    const now = toISODate();
    await this.commentRepo.update(id, {
      markdown: parsed.data.markdown,
      updatedAt: now,
    });

    await this.taskRepo.update(comment.taskId, {
      lastActivityAt: now,
      updatedAt: now,
    });

    eventBus.publish('comment.updated', { id, taskId: comment.taskId });
  }
}
