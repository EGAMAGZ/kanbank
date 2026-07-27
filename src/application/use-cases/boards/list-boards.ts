import type { BoardRepository } from "../../../domain/repositories/board.repository.js";
import type { Board } from "../../../domain/entities/board.entity.js";

export class ListBoardsUseCase {
  constructor(private boardRepo: BoardRepository) {}

  async execute(): Promise<Board[]> {
    const boards = await this.boardRepo.findAll();
    return boards.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }
}
