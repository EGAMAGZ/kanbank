import type { BoardRepository } from "../../../domain/repositories/board.repository.js";
import { type UpdateBoardInput } from "../../dto/board.dto.js";
import type { Id } from "../../../shared/types/index.js";
export declare class UpdateBoardUseCase {
  private boardRepo;
  constructor(boardRepo: BoardRepository);
  execute(id: Id<"Board">, input: UpdateBoardInput): Promise<void>;
}
