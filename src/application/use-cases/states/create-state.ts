import { parseOrThrow } from "../../validation.js";
import type { StateRepository } from "../../../domain/repositories/state.repository.js";
import { createState } from "../../../domain/entities/state.entity.js";
import { generateId } from "../../../shared/types/id.js";
import { toISODate } from "../../../shared/utils/dates.js";
import { eventBus } from "../../../shared/events/event-bus.js";
import {
  type CreateStateInput,
  CreateStateSchema,
} from "../../dto/state.dto.js";

export class CreateStateUseCase {
  constructor(private stateRepo: StateRepository) {}

  async execute(input: CreateStateInput): Promise<string> {
    const parsed = parseOrThrow(CreateStateSchema, input);

    const now = toISODate();
    const stateId = generateId<"State">();

    const existingStates = await this.stateRepo.findByBoard(
      parsed.boardId,
    );
    const order = parsed.order ?? existingStates.length;

    const state = createState({
      id: stateId,
      boardId: parsed.boardId,
      title: parsed.title,
      color: parsed.color ?? "#0066cc",
      order,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    });

    await this.stateRepo.create(state);
    eventBus.publish("state.created", state);
    return stateId;
  }
}
