import type { CommentRepository } from "../../../domain/repositories/comment.repository.js";
import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import { EntityNotFoundError } from "../../../domain/errors/domain-errors.js";
import { toISODate } from "../../../shared/utils/dates.js";
import { eventBus } from "../../../shared/events/event-bus.js";
import type { Id } from "../../../shared/types/id.js";

export class DeleteCommentUseCase {
  constructor(
    private commentRepo: CommentRepository,
    private taskRepo: TaskRepository,
  ) {}

  async execute(id: Id<"Comment">): Promise<void> {
    const comment = await this.commentRepo.findById(id);
    if (!comment) {
      throw new EntityNotFoundError("Comment", id);
    }

    await this.commentRepo.delete(id);

    const now = toISODate();
    await this.taskRepo.update(comment.taskId, {
      lastActivityAt: now,
      updatedAt: now,
    });

    eventBus.publish("comment.deleted", { id, taskId: comment.taskId });
  }
}
