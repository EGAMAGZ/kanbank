import { parseOrThrow } from "../../validation.js";
import { type CreateStepInput, CreateStepSchema } from "../../dto/step.dto.js";
import type { StepRepository } from "../../../domain/repositories/step.repository.js";
import { createStep } from "../../../domain/entities/step.entity.js";
import { generateId } from "../../../shared/types/id.js";
import { toISODate } from "../../../shared/utils/dates.js";
import { eventBus } from "../../../shared/events/event-bus.js";

export class CreateStepUseCase {
  constructor(private stepRepo: StepRepository) {}

  async execute(input: CreateStepInput): Promise<string> {
    const parsed = parseOrThrow(CreateStepSchema, input);
    const now = toISODate();
    const step = createStep({
      id: generateId(),
      taskId: parsed.taskId,
      text: parsed.text,
      order: parsed.order,
      createdAt: now,
      updatedAt: now,
    });
    const id = await this.stepRepo.create(step);
    eventBus.publish("step.created", step);
    return id;
  }
}
