import type { BoardRepository } from "../../../domain/repositories/board.repository.js";
import type { StateRepository } from "../../../domain/repositories/state.repository.js";
import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import type { CommentRepository } from "../../../domain/repositories/comment.repository.js";
import type { ImageRepository } from "../../../domain/repositories/image.repository.js";
import type { StepRepository } from "../../../domain/repositories/step.repository.js";
import type { TimelineRepository } from "../../../domain/repositories/timeline.repository.js";
import type { Id } from "../../../shared/types/index.js";
export declare class DeleteBoardUseCase {
    private boardRepo;
    private stateRepo;
    private taskRepo;
    private commentRepo;
    private imageRepo;
    private stepRepo;
    private timelineRepo;
    constructor(boardRepo: BoardRepository, stateRepo: StateRepository, taskRepo: TaskRepository, commentRepo: CommentRepository, imageRepo: ImageRepository, stepRepo: StepRepository, timelineRepo: TimelineRepository);
    execute(id: Id<"Board">): Promise<void>;
}
