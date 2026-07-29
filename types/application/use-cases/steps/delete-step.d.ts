import type { StepRepository } from "../../../domain/repositories/step.repository.js";
export declare class DeleteStepUseCase {
  private stepRepo;
  constructor(stepRepo: StepRepository);
  execute(id: string): Promise<void>;
}
