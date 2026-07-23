import type { TaskRepository } from '../../../domain/repositories/task.repository.js';
import { type CreateTaskInput } from '../../dto/task.dto.js';
export declare class CreateTaskUseCase {
    private taskRepo;
    constructor(taskRepo: TaskRepository);
    execute(input: CreateTaskInput): Promise<string>;
}
