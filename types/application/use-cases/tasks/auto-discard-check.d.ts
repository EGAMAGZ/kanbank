import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import { MoveTaskUseCase } from "./move-task.js";
import type { Task } from "../../../domain/entities/task.entity.js";
import type { State } from "../../../domain/entities/state.entity.js";
export declare class AutoDiscardCheckUseCase {
    private moveTask;
    constructor(_taskRepo: TaskRepository, moveTask: MoveTaskUseCase);
    execute(tasks: Task[], states: State[]): Promise<number>;
}
