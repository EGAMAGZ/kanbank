import type { StateRepository } from '../../../domain/repositories/state.repository.js';
import { type ReorderStatesInput } from '../../dto/state.dto.js';
export declare class ReorderStatesUseCase {
    private stateRepo;
    constructor(stateRepo: StateRepository);
    execute(input: ReorderStatesInput): Promise<void>;
}
