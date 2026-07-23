import type { StateRepository } from '../../../domain/repositories/state.repository.js';
import type { TaskRepository } from '../../../domain/repositories/task.repository.js';
import type { Id } from '../../../shared/types/index.js';
export declare class DeleteStateUseCase {
    private stateRepo;
    private taskRepo;
    constructor(stateRepo: StateRepository, taskRepo: TaskRepository);
    execute(id: Id<'State'>): Promise<void>;
}
