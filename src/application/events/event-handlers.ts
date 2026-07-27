import { eventBus } from "../../shared/events/event-bus.js";
import type { TaskRepository } from "../../domain/repositories/task.repository.js";
import { toISODate } from "../../shared/types/index.js";

export function registerEventHandlers(taskRepo: TaskRepository): void {
  const updateActivity = async (taskId: string) => {
    const task = await taskRepo.findById(taskId as any);
    if (task) {
      const now = toISODate();
      await taskRepo.update(taskId as any, {
        lastActivityAt: now,
        updatedAt: now,
      });
    }
  };

  eventBus.subscribe("comment.created", async (event) => {
    const payload = event.payload as { taskId: string };
    await updateActivity(payload.taskId);
  });

  eventBus.subscribe("comment.updated", async (event) => {
    const payload = event.payload as { taskId: string };
    await updateActivity(payload.taskId);
  });

  eventBus.subscribe("comment.deleted", async (event) => {
    const payload = event.payload as { taskId: string };
    await updateActivity(payload.taskId);
  });

  eventBus.subscribe("image.added", async (event) => {
    const payload = event.payload as { taskId?: string };
    if (payload.taskId) {
      await updateActivity(payload.taskId);
    }
  });
}
