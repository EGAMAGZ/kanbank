import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import type { ImageRepository } from "../../../domain/repositories/image.repository.js";
import type { Id } from "../../../shared/types/index.js";
export declare class DetachImageUseCase {
  private taskRepo;
  private imageRepo;
  constructor(taskRepo: TaskRepository, imageRepo: ImageRepository);
  execute(taskId: Id<"Task">, imageId: Id<"Image">): Promise<void>;
}
