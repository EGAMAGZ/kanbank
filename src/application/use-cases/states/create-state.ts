import type { StateRepository } from "../../../domain/repositories/state.repository.js";
import { createState } from "../../../domain/entities/state.entity.js";
import { generateId, toISODate } from "../../../shared/types/index.js";
import { eventBus } from "../../../shared/events/event-bus.js";
import {
  type CreateStateInput,
  CreateStateSchema,
} from "../../dto/state.dto.js";
import { ValidationError } from "../../../domain/errors/domain-errors.js";

export class CreateStateUseCase {
  constructor(private stateRepo: StateRepository) {}

  async execute(input: CreateStateInput): Promise<string> {
    const parsed = CreateStateSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((i) => i.message).join(", "),
      );
    }

    const now = toISODate();
    const stateId = generateId<"State">();

    const existingStates = await this.stateRepo.findByBoard(
      parsed.data.boardId as any,
    );
    const order = parsed.data.order ?? existingStates.length;

    const state = createState({
      id: stateId,
      boardId: parsed.data.boardId as any,
      title: parsed.data.title,
      color: parsed.data.color ?? "#0066cc",
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
