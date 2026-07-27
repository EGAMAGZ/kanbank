import type { Id, Timestamped } from "../../shared/types/index.js";
import type { ImageRef } from "../value-objects/image-ref.js";
export interface Task extends Timestamped {
  id: Id<"Task">;
  boardId: Id<"Board">;
  stateId: Id<"State">;
  title: string;
  description: string;
  images: ImageRef[];
  lastActivityAt: string;
}
export interface CreateTaskData {
  id: Id<"Task">;
  boardId: Id<"Board">;
  stateId: Id<"State">;
  title: string;
  description?: string;
  images?: ImageRef[];
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}
export declare function createTask(data: CreateTaskData): Task;
