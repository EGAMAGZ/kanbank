import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import { type SearchTasksInput } from "../../dto/task.dto.js";
import type { Task } from "../../../domain/entities/task.entity.js";
export declare class SearchTasksUseCase {
    private taskRepo;
    constructor(taskRepo: TaskRepository);
    execute(input: SearchTasksInput): Promise<Task[]>;
}
