import { parseOrThrow } from "../../validation.js";
import { type UpdateStepInput, UpdateStepSchema } from "../../dto/step.dto.js";
import {
  EntityNotFoundError,
} from "../../../domain/errors/domain-errors.js";
import type { StepRepository } from "../../../domain/repositories/step.repository.js";
import { eventBus } from "../../../shared/events/event-bus.js";
import type { Id } from "../../../shared/types/id.js";

export class UpdateStepUseCase {
  constructor(private stepRepo: StepRepository) {}

  async execute(id: Id<"Step">, input: UpdateStepInput): Promise<void> {
    const parsed = parseOrThrow(UpdateStepSchema, input);
    const existing = await this.stepRepo.findById(id);
    if (!existing) {
      throw new EntityNotFoundError("Step", id);
    }
    await this.stepRepo.update(id, { ...parsed });
    eventBus.publish("step.updated", {
      id,
      taskId: existing.taskId,
      ...parsed,
    });
  }
}
