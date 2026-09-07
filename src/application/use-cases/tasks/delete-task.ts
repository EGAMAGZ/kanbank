import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import type { CommentRepository } from "../../../domain/repositories/comment.repository.js";
import type { ImageRepository } from "../../../domain/repositories/image.repository.js";
import type { StepRepository } from "../../../domain/repositories/step.repository.js";
import type { TimelineRepository } from "../../../domain/repositories/timeline.repository.js";
import { EntityNotFoundError } from "../../../domain/errors/domain-errors.js";
import { eventBus } from "../../../shared/events/event-bus.js";
import type { Id } from "../../../shared/types/id.js";

export class DeleteTaskUseCase {
  constructor(
    private taskRepo: TaskRepository,
    private commentRepo: CommentRepository,
    private imageRepo: ImageRepository,
    private stepRepo: StepRepository,
    private timelineRepo: TimelineRepository,
  ) {}

  async execute(id: Id<"Task">): Promise<void> {
    const task = await this.taskRepo.findById(id);
    if (!task) {
      throw new EntityNotFoundError("Task", id);
    }

    const comments = await this.commentRepo.findByTask(id);
    for (const comment of comments) {
      for (const img of comment.images) {
        await this.imageRepo.delete(img.id);
      }
      await this.commentRepo.delete(comment.id);
    }

    for (const img of task.images) {
      await this.imageRepo.delete(img.id);
    }

    await this.stepRepo.deleteByTask(id);
    await this.timelineRepo.deleteByTask(id);
    await this.taskRepo.delete(id);
    eventBus.publish("task.deleted", { id, boardId: task.boardId });
  }
}
