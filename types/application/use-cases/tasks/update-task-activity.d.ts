import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import type { Id } from "../../../shared/types/index.js";
export declare class UpdateTaskActivityUseCase {
    private taskRepo;
    constructor(taskRepo: TaskRepository);
    execute(id: Id<"Task">): Promise<void>;
}
