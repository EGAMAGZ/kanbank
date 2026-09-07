import type { StepRepository } from "../../../domain/repositories/step.repository.js";
import { EntityNotFoundError } from "../../../domain/errors/domain-errors.js";
import { eventBus } from "../../../shared/events/event-bus.js";
import type { Id } from "../../../shared/types/id.js";

export class DeleteStepUseCase {
  constructor(private stepRepo: StepRepository) {}

  async execute(id: Id<"Step">): Promise<void> {
    const existing = await this.stepRepo.findById(id);
    if (!existing) {
      throw new EntityNotFoundError("Step", id);
    }
    await this.stepRepo.delete(id);
    eventBus.publish("step.deleted", { id, taskId: existing.taskId });
  }
}
