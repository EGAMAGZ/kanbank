import type { Id } from "../../shared/types/index.js";
import type { Task } from "../entities/task.entity.js";

export interface TaskRepository {
  findByBoard(boardId: Id<"Board">): Promise<Task[]>;
  findByState(stateId: Id<"State">): Promise<Task[]>;
  findById(id: Id<"Task">): Promise<Task | undefined>;
  findPinned(): Promise<Task[]>;
  create(task: Task): Promise<Id<"Task">>;
  update(
    id: Id<"Task">,
    changes: Partial<
      Pick<
        Task,
        | "title"
        | "description"
        | "stateId"
        | "images"
        | "lastActivityAt"
        | "updatedAt"
        | "pinned"
        | "dueDate"
        | "notNowSince"
        | "isGold"
      >
    >,
  ): Promise<void>;
  delete(id: Id<"Task">): Promise<void>;
  move(id: Id<"Task">, newStateId: Id<"State">, order: number): Promise<void>;
  search(boardId: Id<"Board">, query: string): Promise<Task[]>;
}
