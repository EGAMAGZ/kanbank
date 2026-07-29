import type { Id } from "../../shared/types/index.js";
import type { Step } from "../../domain/entities/step.entity.js";
import type { StepRepository } from "../../domain/repositories/step.repository.js";
export declare class DexieStepRepository implements StepRepository {
  findByTask(taskId: Id<"Task">): Promise<Step[]>;
  findById(id: Id<"Step">): Promise<Step | undefined>;
  create(step: Step): Promise<Id<"Step">>;
  update(
    id: Id<"Step">,
    changes: Partial<Pick<Step, "text" | "checked" | "order">>,
  ): Promise<void>;
  delete(id: Id<"Step">): Promise<void>;
  deleteByTask(taskId: Id<"Task">): Promise<void>;
}
