import { parseOrThrow } from "../../validation.js";
import type { BoardRepository } from "../../../domain/repositories/board.repository.js";
import {
  type UpdateBoardInput,
  UpdateBoardSchema,
} from "../../dto/board.dto.js";
import {
  EntityNotFoundError,
} from "../../../domain/errors/domain-errors.js";
import { toISODate } from "../../../shared/utils/dates.js";
import { eventBus } from "../../../shared/events/event-bus.js";
import type { Id } from "../../../shared/types/id.js";

export class UpdateBoardUseCase {
  constructor(private boardRepo: BoardRepository) {}

  async execute(id: Id<"Board">, input: UpdateBoardInput): Promise<void> {
    const parsed = parseOrThrow(UpdateBoardSchema, input);

    const board = await this.boardRepo.findById(id);
    if (!board) {
      throw new EntityNotFoundError("Board", id);
    }

    await this.boardRepo.update(id, {
      ...parsed,
      updatedAt: toISODate(),
    });

    eventBus.publish("board.updated", { id, ...parsed });
  }
}
