import type { Id } from "../../shared/types/index.js";
import type { Board } from "../../domain/entities/board.entity.js";
import type { BoardRepository } from "../../domain/repositories/board.repository.js";
import { db } from "../database/dexie-db.js";

export class DexieBoardRepository implements BoardRepository {
  async findAll(): Promise<Board[]> {
    return db.boards.toArray();
  }

  async findById(id: Id<"Board">): Promise<Board | undefined> {
    return db.boards.get(id);
  }

  async create(board: Board): Promise<Id<"Board">> {
    await db.boards.add(board);
    return board.id;
  }

  async update(
    id: Id<"Board">,
    changes: Partial<Pick<Board, "title" | "description" | "updatedAt">>,
  ): Promise<void> {
    await db.boards.update(id, changes);
  }

  async delete(id: Id<"Board">): Promise<void> {
    await db.boards.delete(id);
  }
}
