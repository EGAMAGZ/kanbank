import type { BoardRepository } from "../../../domain/repositories/board.repository.js";
import type { StateRepository } from "../../../domain/repositories/state.repository.js";
import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import type { CommentRepository } from "../../../domain/repositories/comment.repository.js";
import type { ImageRepository } from "../../../domain/repositories/image.repository.js";
import type { StepRepository } from "../../../domain/repositories/step.repository.js";
import type { TimelineRepository } from "../../../domain/repositories/timeline.repository.js";
import { EntityNotFoundError } from "../../../domain/errors/domain-errors.js";
import { eventBus } from "../../../shared/events/event-bus.js";
import type { Id } from "../../../shared/types/index.js";

export class DeleteBoardUseCase {
  constructor(
    private boardRepo: BoardRepository,
    private stateRepo: StateRepository,
    private taskRepo: TaskRepository,
    private commentRepo: CommentRepository,
    private imageRepo: ImageRepository,
    private stepRepo: StepRepository,
    private timelineRepo: TimelineRepository,
  ) {}

  async execute(id: Id<"Board">): Promise<void> {
    const board = await this.boardRepo.findById(id);
    if (!board) {
      throw new EntityNotFoundError("Board", id);
    }

    const states = await this.stateRepo.findByBoard(id);
    const tasks = await this.taskRepo.findByBoard(id);

    for (const task of tasks) {
      const comments = await this.commentRepo.findByTask(task.id);
      for (const comment of comments) {
        for (const img of comment.images) {
          await this.imageRepo.delete(img.id);
        }
        await this.commentRepo.delete(comment.id);
      }
      for (const img of task.images) {
        await this.imageRepo.delete(img.id);
      }
      await this.stepRepo.deleteByTask(task.id);
      await this.timelineRepo.deleteByTask(task.id);
      await this.taskRepo.delete(task.id);
    }

    for (const state of states) {
      await this.stateRepo.delete(state.id);
    }

    await this.boardRepo.delete(id);

    eventBus.publish("board.deleted", { id });
  }
}
