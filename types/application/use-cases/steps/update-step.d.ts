import { type UpdateStepInput } from "../../dto/step.dto.js";
import type { StepRepository } from "../../../domain/repositories/step.repository.js";
export declare class UpdateStepUseCase {
  private stepRepo;
  constructor(stepRepo: StepRepository);
  execute(id: string, input: UpdateStepInput): Promise<void>;
}
