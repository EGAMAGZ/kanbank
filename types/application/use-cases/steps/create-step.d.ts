import { type CreateStepInput } from "../../dto/step.dto.js";
import type { StepRepository } from "../../../domain/repositories/step.repository.js";
export declare class CreateStepUseCase {
    private stepRepo;
    constructor(stepRepo: StepRepository);
    execute(input: CreateStepInput): Promise<string>;
}
