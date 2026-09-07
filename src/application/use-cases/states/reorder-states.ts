import { parseOrThrow } from "../../validation.js";
import type { StateRepository } from "../../../domain/repositories/state.repository.js";
import {
  type ReorderStatesInput,
  ReorderStatesSchema,
} from "../../dto/state.dto.js";
import { toISODate } from "../../../shared/utils/dates.js";
import { eventBus } from "../../../shared/events/event-bus.js";

export class ReorderStatesUseCase {
  constructor(private stateRepo: StateRepository) {}

  async execute(input: ReorderStatesInput): Promise<void> {
    const parsed = parseOrThrow(ReorderStatesSchema, input);

    const now = toISODate();
    for (let i = 0; i < parsed.stateIds.length; i++) {
      await this.stateRepo.update(parsed.stateIds[i], {
        order: i,
        updatedAt: now,
      });
    }

    eventBus.publish("state.reordered", {
      boardId: parsed.boardId,
      stateIds: parsed.stateIds,
    });
  }
}
