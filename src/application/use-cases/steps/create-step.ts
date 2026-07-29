import { type CreateStepInput, CreateStepSchema } from "../../dto/step.dto.js";
import { ValidationError } from "../../../domain/errors/domain-errors.js";
import type { StepRepository } from "../../../domain/repositories/step.repository.js";
import { createStep } from "../../../domain/entities/step.entity.js";
import { generateId, toISODate } from "../../../shared/types/index.js";
import { eventBus } from "../../../shared/events/event-bus.js";

export class CreateStepUseCase {
  constructor(private stepRepo: StepRepository) {}

  async execute(input: CreateStepInput): Promise<string> {
    const parsed = CreateStepSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((i) => i.message).join(", "),
      );
    }
    const now = toISODate();
    const step = createStep({
      id: generateId(),
      taskId: parsed.data.taskId as any,
      text: parsed.data.text,
      order: parsed.data.order,
      createdAt: now,
      updatedAt: now,
    });
    const id = await this.stepRepo.create(step);
    eventBus.publish("step.created", { ...step, taskId: parsed.data.taskId });
    return id;
  }
}
