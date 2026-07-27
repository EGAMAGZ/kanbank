import type { BoardRepository } from "../../../domain/repositories/board.repository.js";
import type { StateRepository } from "../../../domain/repositories/state.repository.js";
import { type CreateBoardInput } from "../../dto/board.dto.js";
export declare class CreateBoardUseCase {
    private boardRepo;
    private stateRepo;
    constructor(boardRepo: BoardRepository, stateRepo: StateRepository);
    execute(input: CreateBoardInput): Promise<string>;
}
