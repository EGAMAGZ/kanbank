import type { Id, Timestamped } from "../../shared/types/index.js";
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
export declare function createBoard(data: CreateBoardData): Board;
