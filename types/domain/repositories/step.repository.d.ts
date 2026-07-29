import type { Id } from "../../shared/types/index.js";
import type { Step } from "../entities/step.entity.js";
export interface StepRepository {
    findByTask(taskId: Id<"Task">): Promise<Step[]>;
    findById(id: Id<"Step">): Promise<Step | undefined>;
    create(step: Step): Promise<Id<"Step">>;
    update(id: Id<"Step">, changes: Partial<Pick<Step, "text" | "checked" | "order">>): Promise<void>;
    delete(id: Id<"Step">): Promise<void>;
    deleteByTask(taskId: Id<"Task">): Promise<void>;
}
