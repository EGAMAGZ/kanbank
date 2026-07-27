import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import type { CommentRepository } from "../../../domain/repositories/comment.repository.js";
import { EntityNotFoundError } from "../../../domain/errors/domain-errors.js";
import { eventBus } from "../../../shared/events/event-bus.js";
import type { Id } from "../../../shared/types/index.js";

export class DeleteTaskUseCase {
  constructor(
    private taskRepo: TaskRepository,
    private commentRepo: CommentRepository,
  ) {}

  async execute(id: Id<"Task">): Promise<void> {
    const task = await this.taskRepo.findById(id);
    if (!task) {
      throw new EntityNotFoundError("Task", id);
    }

    const comments = await this.commentRepo.findByTask(id);
    for (const comment of comments) {
      await this.commentRepo.delete(comment.id);
    }

    await this.taskRepo.delete(id);
    eventBus.publish("task.deleted", { id, boardId: task.boardId });
  }
}
