import { parseOrThrow } from "../../validation.js";
import type { BoardRepository } from "../../../domain/repositories/board.repository.js";
import type { StateRepository } from "../../../domain/repositories/state.repository.js";
import { createBoard } from "../../../domain/entities/board.entity.js";
import { createState } from "../../../domain/entities/state.entity.js";
import { generateId } from "../../../shared/types/id.js";
import { toISODate } from "../../../shared/utils/dates.js";
import { MANDATORY_STATES } from "../../../shared/constants/defaults.js";
import { eventBus } from "../../../shared/events/event-bus.js";
import {
  type CreateBoardInput,
  CreateBoardSchema,
} from "../../dto/board.dto.js";

export class CreateBoardUseCase {
  constructor(
    private boardRepo: BoardRepository,
    private stateRepo: StateRepository,
  ) {}

  async execute(input: CreateBoardInput): Promise<string> {
    const parsed = parseOrThrow(CreateBoardSchema, input);

    const now = toISODate();
    const boardId = generateId<"Board">();

    const board = createBoard({
      id: boardId,
      title: parsed.title,
      description: parsed.description,
      createdAt: now,
      updatedAt: now,
    });

    await this.boardRepo.create(board);

    const mandatoryColors = ["#cc6600", "#FFFFFF", "#28a745"];
    for (let i = 0; i < MANDATORY_STATES.length; i++) {
      const stateId = generateId<"State">();
      const state = createState({
        id: stateId,
        boardId,
        title: MANDATORY_STATES[i],
        color: mandatoryColors[i] ?? "#0066cc",
        order: i,
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      });
      await this.stateRepo.create(state);
    }

    eventBus.publish("board.created", board);
    return boardId;
  }
}
