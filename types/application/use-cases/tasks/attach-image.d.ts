import type { TaskRepository } from '../../../domain/repositories/task.repository.js';
import type { ImageRepository } from '../../../domain/repositories/image.repository.js';
import type { Id } from '../../../shared/types/index.js';
import type { ImageRef } from '../../../domain/value-objects/image-ref.js';
export declare class AttachImageUseCase {
    private taskRepo;
    private imageRepo;
    constructor(taskRepo: TaskRepository, imageRepo: ImageRepository);
    execute(taskId: Id<'Task'>, file: File): Promise<ImageRef>;
}
