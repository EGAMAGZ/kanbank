import type { BoardRepository } from "../../../domain/repositories/board.repository.js";
import {
  type UpdateBoardInput,
  UpdateBoardSchema,
} from "../../dto/board.dto.js";
import {
  EntityNotFoundError,
  ValidationError,
} from "../../../domain/errors/domain-errors.js";
import { toISODate } from "../../../shared/types/index.js";
import { eventBus } from "../../../shared/events/event-bus.js";
import type { Id } from "../../../shared/types/index.js";

export class UpdateBoardUseCase {
  constructor(private boardRepo: BoardRepository) {}

  async execute(id: Id<"Board">, input: UpdateBoardInput): Promise<void> {
    const parsed = UpdateBoardSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues.map((i) => i.message).join(", "),
      );
    }

    const board = await this.boardRepo.findById(id);
    if (!board) {
      throw new EntityNotFoundError("Board", id);
    }

    await this.boardRepo.update(id, {
      ...parsed.data,
      updatedAt: toISODate(),
    });

    eventBus.publish("board.updated", { id, ...parsed.data });
  }
}
