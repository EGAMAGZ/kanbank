import { type UpdateStepInput, UpdateStepSchema } from "../../dto/step.dto.js";
import {
  EntityNotFoundError,
  ValidationError,
} from "../../../domain/errors/domain-errors.js";
import type { StepRepository } from "../../../domain/repositories/step.repository.js";
import { eventBus } from "../../../shared/events/event-bus.js";

export class UpdateStepUseCase {
  constructor(private stepRepo: StepRepository) {}

  async execute(id: string, input: UpdateStepInput): Promise<void> {
    const parsed = UpdateStepSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((i) => i.message).join(", "),
      );
    }
    const existing = await this.stepRepo.findById(id as any);
    if (!existing) {
      throw new EntityNotFoundError("Step", id);
    }
    await this.stepRepo.update(id as any, { ...parsed.data });
    eventBus.publish("step.updated", {
      id,
      taskId: existing.taskId,
      ...parsed.data,
    });
  }
}
