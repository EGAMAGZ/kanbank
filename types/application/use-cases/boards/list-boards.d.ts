import type { BoardRepository } from "../../../domain/repositories/board.repository.js";
import type { Board } from "../../../domain/entities/board.entity.js";
export declare class ListBoardsUseCase {
  private boardRepo;
  constructor(boardRepo: BoardRepository);
  execute(): Promise<Board[]>;
}
