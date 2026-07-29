import {
  type UpdateBoardInput,
  UpdateBoardSchema,
} from "../../dto/board.dto.js";
import { type Id } from "../../../shared/types/index.js";
import {
  EntityNotFoundError,
  ValidationError,
} from "../../../domain/errors/domain-errors.js";
import type { BoardRepository } from "../../../domain/repositories/board.repository.js";
import { toISODate } from "../../../shared/types/index.js";
import { eventBus } from "../../../shared/events/event-bus.js";

export class UpdateBoardSettingsUseCase {
  constructor(private boardRepo: BoardRepository) {}

  async execute(id: Id<"Board">, input: UpdateBoardInput): Promise<void> {
    const parsed = UpdateBoardSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((i) => i.message).join(", "),
      );
    }
    const existing = await this.boardRepo.findById(id);
    if (!existing) {
      throw new EntityNotFoundError("Board", id);
    }
    const changes: Record<string, unknown> = { updatedAt: toISODate() };
    if (parsed.data.title !== undefined) changes.title = parsed.data.title;
    if (parsed.data.description !== undefined) {
      changes.description = parsed.data.description;
    }
    if (parsed.data.autoCloseDays !== undefined) {
      changes.autoCloseDays = parsed.data.autoCloseDays;
    }
    if (parsed.data.autoCloseEnabled !== undefined) {
      changes.autoCloseEnabled = parsed.data.autoCloseEnabled;
    }
    if (parsed.data.publicLink !== undefined) {
      changes.publicLink = parsed.data.publicLink;
    }
    if (parsed.data.accessControl !== undefined) {
      changes.accessControl = parsed.data.accessControl;
    }

    await this.boardRepo.update(id, changes as any);
    eventBus.publish("board.updated", { id, ...changes });
  }
}
