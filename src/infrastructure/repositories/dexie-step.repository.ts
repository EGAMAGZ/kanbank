import type { Id } from "../../shared/types/id.js";
import type { Step } from "../../domain/entities/step.entity.js";
import type { StepRepository } from "../../domain/repositories/step.repository.js";
import { db } from "../database/dexie-db.js";

export class DexieStepRepository implements StepRepository {
  async findByTask(taskId: Id<"Task">): Promise<Step[]> {
    return db.steps.where("taskId").equals(taskId).sortBy("order");
  }

  async findById(id: Id<"Step">): Promise<Step | undefined> {
    return db.steps.get(id);
  }

  async create(step: Step): Promise<Id<"Step">> {
    await db.steps.add(step);
    return step.id;
  }

  async update(
    id: Id<"Step">,
    changes: Partial<Pick<Step, "text" | "checked" | "order">>,
  ): Promise<void> {
    await db.steps.update(id, changes);
  }

  async delete(id: Id<"Step">): Promise<void> {
    await db.steps.delete(id);
  }

  async deleteByTask(taskId: Id<"Task">): Promise<void> {
    await db.steps.where("taskId").equals(taskId).delete();
  }
}
