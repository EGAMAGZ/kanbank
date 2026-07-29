import type { Id } from "../../shared/types/index.js";
import type { Task } from "../../domain/entities/task.entity.js";
import type { TaskRepository } from "../../domain/repositories/task.repository.js";
import { db } from "../database/dexie-db.js";

export class DexieTaskRepository implements TaskRepository {
  async findAll(): Promise<Task[]> {
    return db.tasks.toArray();
  }

  async findByBoard(boardId: Id<"Board">): Promise<Task[]> {
    return db.tasks.where("boardId").equals(boardId).toArray();
  }

  async findByState(stateId: Id<"State">): Promise<Task[]> {
    return db.tasks.where("stateId").equals(stateId).toArray();
  }

  async findById(id: Id<"Task">): Promise<Task | undefined> {
    return db.tasks.get(id);
  }

  async findPinned(): Promise<Task[]> {
    return db.tasks.filter((t) => t.pinned === true).toArray();
  }

  async getNextSeq(): Promise<number> {
    const last = await db.tasks.orderBy("seq").last();
    return (last?.seq ?? 0) + 1;
  }

  async create(task: Task): Promise<Id<"Task">> {
    await db.tasks.add(task);
    return task.id;
  }

  async update(
    id: Id<"Task">,
    changes: Partial<
      Pick<
        Task,
        | "title"
        | "description"
        | "boardId"
        | "stateId"
        | "images"
        | "lastActivityAt"
        | "updatedAt"
        | "pinned"
        | "dueDate"
        | "notNowSince"
        | "isGold"
        | "category"
        | "subscriberIds"
      >
    >,
  ): Promise<void> {
    await db.tasks.update(id, changes);
  }

  async delete(id: Id<"Task">): Promise<void> {
    await db.tasks.delete(id);
  }

  async move(
    id: Id<"Task">,
    newStateId: Id<"State">,
    _order: number,
  ): Promise<void> {
    await db.tasks.update(id, { stateId: newStateId });
  }

  async search(boardId: Id<"Board">, query: string): Promise<Task[]> {
    const lowerQuery = query.toLowerCase();
    const tasks = await db.tasks.where("boardId").equals(boardId).toArray();
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery),
    );
  }
}
