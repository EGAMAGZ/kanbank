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
  pinned: boolean;
  dueDate: string | null;
  notNowSince: string | null;
  isGold: boolean;
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
  pinned?: boolean;
  dueDate?: string | null;
  notNowSince?: string | null;
  isGold?: boolean;
}

export function createTask(data: CreateTaskData): Task {
  return {
    id: data.id,
    boardId: data.boardId,
    stateId: data.stateId,
    title: data.title,
    description: data.description ?? "",
    images: data.images ?? [],
    lastActivityAt: data.lastActivityAt,
    pinned: data.pinned ?? false,
    dueDate: data.dueDate ?? null,
    notNowSince: data.notNowSince ?? null,
    isGold: data.isGold ?? false,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}
