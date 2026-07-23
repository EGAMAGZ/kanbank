import type { StateRepository } from '../../../domain/repositories/state.repository.js';
import { type CreateStateInput } from '../../dto/state.dto.js';
export declare class CreateStateUseCase {
    private stateRepo;
    constructor(stateRepo: StateRepository);
    execute(input: CreateStateInput): Promise<string>;
}
