import type { StateRepository } from "../../../domain/repositories/state.repository.js";
import {
  type ReorderStatesInput,
  ReorderStatesSchema,
} from "../../dto/state.dto.js";
import { ValidationError } from "../../../domain/errors/domain-errors.js";
import { toISODate } from "../../../shared/types/index.js";
import { eventBus } from "../../../shared/events/event-bus.js";

export class ReorderStatesUseCase {
  constructor(private stateRepo: StateRepository) {}

  async execute(input: ReorderStatesInput): Promise<void> {
    const parsed = ReorderStatesSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((i) => i.message).join(", "),
      );
    }

    const now = toISODate();
    for (let i = 0; i < parsed.data.stateIds.length; i++) {
      await this.stateRepo.update(parsed.data.stateIds[i] as any, {
        order: i,
        updatedAt: now,
      });
    }

    eventBus.publish("state.reordered", {
      boardId: parsed.data.boardId,
      stateIds: parsed.data.stateIds,
    });
  }
}
