import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import type { ImageRepository } from "../../../domain/repositories/image.repository.js";
import {
  EntityNotFoundError,
  ImageStorageError,
} from "../../../domain/errors/domain-errors.js";
import { eventBus } from "../../../shared/events/event-bus.js";
import type { Id } from "../../../shared/types/id.js";

export class DetachImageUseCase {
  constructor(
    private taskRepo: TaskRepository,
    private imageRepo: ImageRepository,
  ) {}

  async execute(taskId: Id<"Task">, imageId: Id<"Image">): Promise<void> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new EntityNotFoundError("Task", taskId);
    }

    const filtered = task.images.filter((img) => img.id !== imageId);
    if (filtered.length === task.images.length) {
      throw new EntityNotFoundError("Image", imageId);
    }

    try {
      await this.taskRepo.update(taskId, { images: filtered });
      await this.imageRepo.delete(imageId);
    } catch (e) {
      throw new ImageStorageError(
        `Failed to remove image: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    eventBus.publish("image.added", { taskId });
  }
}
