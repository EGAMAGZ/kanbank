import type { CommentRepository } from "../../../domain/repositories/comment.repository.js";
import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import type { ImageRepository } from "../../../domain/repositories/image.repository.js";
import { toISODate } from "../../../shared/types/index.js";
import { eventBus } from "../../../shared/events/event-bus.js";
import {
  EntityNotFoundError,
  ImageStorageError,
} from "../../../domain/errors/domain-errors.js";
import type { Id } from "../../../shared/types/index.js";
import type { ImageRef } from "../../../domain/value-objects/image-ref.js";

export class AttachImageCommentUseCase {
  constructor(
    private commentRepo: CommentRepository,
    private taskRepo: TaskRepository,
    private imageRepo: ImageRepository,
  ) {}

  async execute(commentId: Id<"Comment">, file: File): Promise<ImageRef> {
    const comment = await this.commentRepo.findById(commentId);
    if (!comment) {
      throw new EntityNotFoundError("Comment", commentId);
    }

    try {
      const blob = new Blob([await file.arrayBuffer()], { type: file.type });
      const imageId = await this.imageRepo.store(blob, {
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      });

      const imageRef: ImageRef = {
        id: imageId,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      };

      const now = toISODate();
      await this.commentRepo.update(commentId, {
        images: [...comment.images, imageRef],
        updatedAt: now,
      });

      await this.taskRepo.update(comment.taskId, {
        lastActivityAt: now,
        updatedAt: now,
      });

      eventBus.publish("image.added", { commentId, imageRef });
      return imageRef;
    } catch (e) {
      throw new ImageStorageError(
        `Failed to store image: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
}
