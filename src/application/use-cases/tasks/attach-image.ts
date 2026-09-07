import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import type { ImageRepository } from "../../../domain/repositories/image.repository.js";
import { eventBus } from "../../../shared/events/event-bus.js";
import {
  EntityNotFoundError,
  ImageStorageError,
} from "../../../domain/errors/domain-errors.js";
import type { Id } from "../../../shared/types/id.js";
import type { ImageRef } from "../../../domain/value-objects/image-ref.js";

export class AttachImageUseCase {
  constructor(
    private taskRepo: TaskRepository,
    private imageRepo: ImageRepository,
  ) {}

  async execute(taskId: Id<"Task">, file: File): Promise<ImageRef> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new EntityNotFoundError("Task", taskId);
    }

    try {
      const blob = new Blob([await file.arrayBuffer()], { type: file.type });
      const imageId = await this.imageRepo.store(blob, {
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      });

      const imageRef: ImageRef = {
        id: imageId,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      };

      await this.taskRepo.update(taskId, {
        images: [...task.images, imageRef],
      });

      eventBus.publish("image.added", { taskId, imageRef });
      return imageRef;
    } catch (e) {
      throw new ImageStorageError(
        `Failed to store image: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
}
