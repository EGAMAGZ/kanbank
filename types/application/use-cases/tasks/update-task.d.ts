import type { TaskRepository } from '../../../domain/repositories/task.repository.js';
import { type UpdateTaskInput } from '../../dto/task.dto.js';
import type { Id } from '../../../shared/types/index.js';
export declare class UpdateTaskUseCase {
    private taskRepo;
    constructor(taskRepo: TaskRepository);
    execute(id: Id<'Task'>, input: UpdateTaskInput): Promise<void>;
}
