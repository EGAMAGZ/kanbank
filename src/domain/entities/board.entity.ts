import type { Id } from "../../shared/types/id.js";
import type { Timestamped } from "../../shared/types/common.js";

export interface Board extends Timestamped {
  id: Id<"Board">;
  title: string;
  description: string;
  autoCloseDays: number;
  autoCloseEnabled: boolean;
  publicLink: boolean;
  accessControl: "everyone" | "restricted";
}

export interface CreateBoardData {
  id: Id<"Board">;
  title: string;
  description?: string;
  autoCloseDays?: number;
  autoCloseEnabled?: boolean;
  publicLink?: boolean;
  accessControl?: "everyone" | "restricted";
  createdAt: string;
  updatedAt: string;
}

export function createBoard(data: CreateBoardData): Board {
  return {
    id: data.id,
    title: data.title,
    description: data.description ?? "",
    autoCloseDays: data.autoCloseDays ?? 7,
    autoCloseEnabled: data.autoCloseEnabled ?? false,
    publicLink: data.publicLink ?? false,
    accessControl: data.accessControl ?? "everyone",
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}
