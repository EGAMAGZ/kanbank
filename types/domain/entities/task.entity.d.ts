import type { Id, Timestamped } from "../../shared/types/index.js";
import type { ImageRef } from "../value-objects/image-ref.js";
export interface Task extends Timestamped {
  id: Id<"Task">;
  seq: number;
  boardId: Id<"Board">;
  stateId: Id<"State">;
  title: string;
  description: string;
  images: ImageRef[];
  lastActivityAt: string;
  pinned: boolean;
  dueDate: string | null;
  notNowSince: string | null;
  isGold: boolean;
  category: string;
  subscriberIds: string[];
}
export interface CreateTaskData {
  id: Id<"Task">;
  seq: number;
  boardId: Id<"Board">;
  stateId: Id<"State">;
  title: string;
  description?: string;
  images?: ImageRef[];
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
  dueDate?: string | null;
  notNowSince?: string | null;
  isGold?: boolean;
  category?: string;
  subscriberIds?: string[];
}
export declare function createTask(data: CreateTaskData): Task;
