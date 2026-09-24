import type { Id } from "../../shared/types/id.js";
import type { Timestamped } from "../../shared/types/common.js";
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
  stateChangedAt: string;
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
  stateChangedAt?: string;
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
  dueDate?: string | null;
  notNowSince?: string | null;
  isGold?: boolean;
  category?: string;
  subscriberIds?: string[];
}

export function createTask(data: CreateTaskData): Task {
  return {
    id: data.id,
    seq: data.seq,
    boardId: data.boardId,
    stateId: data.stateId,
    title: data.title,
    description: data.description ?? "",
    images: data.images ?? [],
    lastActivityAt: data.lastActivityAt,
    stateChangedAt: data.stateChangedAt ?? data.createdAt,
    pinned: data.pinned ?? false,
    dueDate: data.dueDate ?? null,
    notNowSince: data.notNowSince ?? null,
    isGold: data.isGold ?? false,
    category: data.category ?? "",
    subscriberIds: data.subscriberIds ?? [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}
