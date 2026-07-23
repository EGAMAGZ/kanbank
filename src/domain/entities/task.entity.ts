import type { Id, Timestamped } from '../../shared/types/index.js';
import type { ImageRef } from '../value-objects/image-ref.js';

export interface Task extends Timestamped {
  id: Id<'Task'>;
  boardId: Id<'Board'>;
  stateId: Id<'State'>;
  title: string;
  description: string;
  images: ImageRef[];
  lastActivityAt: string;
}

export interface CreateTaskData {
  id: Id<'Task'>;
  boardId: Id<'Board'>;
  stateId: Id<'State'>;
  title: string;
  description?: string;
  images?: ImageRef[];
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

export function createTask(data: CreateTaskData): Task {
  return {
    id: data.id,
    boardId: data.boardId,
    stateId: data.stateId,
    title: data.title,
    description: data.description ?? '',
    images: data.images ?? [],
    lastActivityAt: data.lastActivityAt,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}
