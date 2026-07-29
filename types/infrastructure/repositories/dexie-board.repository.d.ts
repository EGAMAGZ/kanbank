import type { Id } from "../../shared/types/index.js";
import type { Board } from "../../domain/entities/board.entity.js";
import type { BoardRepository } from "../../domain/repositories/board.repository.js";
export declare class DexieBoardRepository implements BoardRepository {
    findAll(): Promise<Board[]>;
    findById(id: Id<"Board">): Promise<Board | undefined>;
    create(board: Board): Promise<Id<"Board">>;
    update(id: Id<"Board">, changes: Partial<Pick<Board, "title" | "description" | "updatedAt" | "autoCloseDays" | "autoCloseEnabled" | "publicLink" | "accessControl">>): Promise<void>;
    delete(id: Id<"Board">): Promise<void>;
}
