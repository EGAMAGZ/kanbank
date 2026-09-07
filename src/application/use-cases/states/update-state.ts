import { parseOrThrow } from "../../validation.js";
import type { StateRepository } from "../../../domain/repositories/state.repository.js";
import {
  type UpdateStateInput,
  UpdateStateSchema,
} from "../../dto/state.dto.js";
import {
  EntityNotFoundError,
} from "../../../domain/errors/domain-errors.js";
import { toISODate } from "../../../shared/utils/dates.js";
import { eventBus } from "../../../shared/events/event-bus.js";
import type { Id } from "../../../shared/types/id.js";

export class UpdateStateUseCase {
  constructor(private stateRepo: StateRepository) {}

  async execute(id: Id<"State">, input: UpdateStateInput): Promise<void> {
    const parsed = parseOrThrow(UpdateStateSchema, input);

    const state = await this.stateRepo.findById(id);
    if (!state) {
      throw new EntityNotFoundError("State", id);
    }

    await this.stateRepo.update(id, {
      ...parsed,
      updatedAt: toISODate(),
    });

    eventBus.publish("state.updated", { id, ...parsed });
  }
}
