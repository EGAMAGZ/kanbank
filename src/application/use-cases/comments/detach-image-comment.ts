import type { CommentRepository } from '../../../domain/repositories/comment.repository.js';
import type { TaskRepository } from '../../../domain/repositories/task.repository.js';
import type { ImageRepository } from '../../../domain/repositories/image.repository.js';
import { EntityNotFoundError, ImageStorageError } from '../../../domain/errors/domain-errors.js';
import { toISODate } from '../../../shared/types/index.js';
import { eventBus } from '../../../shared/events/event-bus.js';
import type { Id } from '../../../shared/types/index.js';

export class DetachImageCommentUseCase {
  constructor(
    private commentRepo: CommentRepository,
    private taskRepo: TaskRepository,
    private imageRepo: ImageRepository,
  ) {}

  async execute(commentId: Id<'Comment'>, imageId: Id<'Image'>): Promise<void> {
    const comment = await this.commentRepo.findById(commentId);
    if (!comment) {
      throw new EntityNotFoundError('Comment', commentId);
    }

    const filtered = comment.images.filter(img => img.id !== imageId);
    if (filtered.length === comment.images.length) {
      throw new EntityNotFoundError('Image', imageId);
    }

    const now = toISODate();
    try {
      await this.commentRepo.update(commentId, { images: filtered, updatedAt: now });
      await this.imageRepo.delete(imageId);
      await this.taskRepo.update(comment.taskId, { lastActivityAt: now, updatedAt: now });
    } catch (e) {
      throw new ImageStorageError(`Failed to remove image: ${e instanceof Error ? e.message : String(e)}`);
    }

    eventBus.publish('image.added', { commentId });
  }
}
