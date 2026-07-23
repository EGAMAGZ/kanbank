import type { Id } from '../../shared/types/index.js';
import type { Task } from '../../domain/entities/task.entity.js';
import type { TaskRepository } from '../../domain/repositories/task.repository.js';
export declare class DexieTaskRepository implements TaskRepository {
    findByBoard(boardId: Id<'Board'>): Promise<Task[]>;
    findByState(stateId: Id<'State'>): Promise<Task[]>;
    findById(id: Id<'Task'>): Promise<Task | undefined>;
    create(task: Task): Promise<Id<'Task'>>;
    update(id: Id<'Task'>, changes: Partial<Pick<Task, 'title' | 'description' | 'stateId' | 'images' | 'lastActivityAt' | 'updatedAt'>>): Promise<void>;
    delete(id: Id<'Task'>): Promise<void>;
    move(id: Id<'Task'>, newStateId: Id<'State'>, _order: number): Promise<void>;
    search(boardId: Id<'Board'>, query: string): Promise<Task[]>;
}
