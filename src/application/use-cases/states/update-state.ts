import type { StateRepository } from "../../../domain/repositories/state.repository.js";
import {
  type UpdateStateInput,
  UpdateStateSchema,
} from "../../dto/state.dto.js";
import {
  EntityNotFoundError,
  ValidationError,
} from "../../../domain/errors/domain-errors.js";
import { toISODate } from "../../../shared/types/index.js";
import { eventBus } from "../../../shared/events/event-bus.js";
import type { Id } from "../../../shared/types/index.js";

export class UpdateStateUseCase {
  constructor(private stateRepo: StateRepository) {}

  async execute(id: Id<"State">, input: UpdateStateInput): Promise<void> {
    const parsed = UpdateStateSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((i) => i.message).join(", "),
      );
    }

    const state = await this.stateRepo.findById(id);
    if (!state) {
      throw new EntityNotFoundError("State", id);
    }

    await this.stateRepo.update(id, {
      ...parsed.data,
      updatedAt: toISODate(),
    });

    eventBus.publish("state.updated", { id, ...parsed.data });
  }
}
