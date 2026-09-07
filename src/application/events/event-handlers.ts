import { eventBus } from "../../shared/events/event-bus.js";
import type { TaskRepository } from "../../domain/repositories/task.repository.js";
import { toISODate } from "../../shared/utils/dates.js";
import type { Id } from "../../shared/types/id.js";

export function registerEventHandlers(taskRepo: TaskRepository): void {
  const updateActivity = async (taskId: Id<"Task">) => {
    const task = await taskRepo.findById(taskId);
    if (task) {
      const now = toISODate();
      await taskRepo.update(taskId, {
        lastActivityAt: now,
        updatedAt: now,
      });
    }
  };

  eventBus.subscribe("comment.created", async (event) => {
    await updateActivity(event.payload.taskId);
  });

  eventBus.subscribe("comment.updated", async (event) => {
    await updateActivity(event.payload.taskId);
  });

  eventBus.subscribe("comment.deleted", async (event) => {
    await updateActivity(event.payload.taskId);
  });

  eventBus.subscribe("image.added", async (event) => {
    if (event.payload.taskId) {
      await updateActivity(event.payload.taskId);
    }
  });

  eventBus.subscribe("step.created", async (event) => {
    await updateActivity(event.payload.taskId);
  });

  eventBus.subscribe("step.updated", async (event) => {
    await updateActivity(event.payload.taskId);
  });

  eventBus.subscribe("step.deleted", async (event) => {
    await updateActivity(event.payload.taskId);
  });
}