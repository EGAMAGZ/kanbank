import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import { createTask } from "../../../domain/entities/task.entity.js";
import { generateId, toISODate } from "../../../shared/types/index.js";
import { eventBus } from "../../../shared/events/event-bus.js";
import { type CreateTaskInput, CreateTaskSchema } from "../../dto/task.dto.js";
import { ValidationError } from "../../../domain/errors/domain-errors.js";

export class CreateTaskUseCase {
  constructor(private taskRepo: TaskRepository) {}

  async execute(input: CreateTaskInput): Promise<string> {
    const parsed = CreateTaskSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((i) => i.message).join(", "),
      );
    }

    const now = toISODate();
    const taskId = generateId<"Task">();

    const task = createTask({
      id: taskId,
      boardId: parsed.data.boardId as any,
      stateId: parsed.data.stateId as any,
      title: parsed.data.title,
      description: parsed.data.description,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await this.taskRepo.create(task);
    eventBus.publish("task.created", task);
    return taskId;
  }
}
