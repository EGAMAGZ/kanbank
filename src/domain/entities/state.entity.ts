import type { Id, Timestamped, WithOrder } from '../../shared/types/index.js';

export interface State extends Timestamped, WithOrder {
  id: Id<'State'>;
  boardId: Id<'Board'>;
  title: string;
  isDefault: boolean;
}

export interface CreateStateData {
  id: Id<'State'>;
  boardId: Id<'Board'>;
  title: string;
  order: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export function createState(data: CreateStateData): State {
  return {
    id: data.id,
    boardId: data.boardId,
    title: data.title,
    order: data.order,
    isDefault: data.isDefault,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}
