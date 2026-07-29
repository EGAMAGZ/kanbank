import type { Id } from "../../shared/types/index.js";
import type { Board } from "../entities/board.entity.js";
export interface BoardRepository {
  findAll(): Promise<Board[]>;
  findById(id: Id<"Board">): Promise<Board | undefined>;
  create(board: Board): Promise<Id<"Board">>;
  update(
    id: Id<"Board">,
    changes: Partial<
      Pick<
        Board,
        | "title"
        | "description"
        | "updatedAt"
        | "autoCloseDays"
        | "autoCloseEnabled"
        | "publicLink"
        | "accessControl"
      >
    >,
  ): Promise<void>;
  delete(id: Id<"Board">): Promise<void>;
}
