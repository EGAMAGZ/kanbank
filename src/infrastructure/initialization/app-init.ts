import type { BoardRepository } from "../../domain/repositories/board.repository.js";
import type { StateRepository } from "../../domain/repositories/state.repository.js";
import type { TaskRepository } from "../../domain/repositories/task.repository.js";
import type { CommentRepository } from "../../domain/repositories/comment.repository.js";
import type { ImageRepository } from "../../domain/repositories/image.repository.js";
import type { StepRepository } from "../../domain/repositories/step.repository.js";
import type { TimelineRepository } from "../../domain/repositories/timeline.repository.js";
import { registerEventHandlers } from "../../application/events/event-handlers.js";

export interface AppRepositories {
  boardRepo: BoardRepository;
  stateRepo: StateRepository;
  taskRepo: TaskRepository;
  commentRepo: CommentRepository;
  imageRepo: ImageRepository;
  stepRepo: StepRepository;
  timelineRepo: TimelineRepository;
}

export function initApp(repos: AppRepositories): void {
  registerEventHandlers(repos.taskRepo);
}
