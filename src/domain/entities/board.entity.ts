import type { Id, Timestamped } from "../../shared/types/index.js";

export interface Board extends Timestamped {
  id: Id<"Board">;
  title: string;
  description: string;
}

export interface CreateBoardData {
  id: Id<"Board">;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export function createBoard(data: CreateBoardData): Board {
  return {
    id: data.id,
    title: data.title,
    description: data.description ?? "",
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}
