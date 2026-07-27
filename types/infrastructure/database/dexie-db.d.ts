import { Dexie, type EntityTable } from "dexie";
import type { Board } from "../../domain/entities/board.entity.js";
import type { State } from "../../domain/entities/state.entity.js";
import type { Task } from "../../domain/entities/task.entity.js";
import type { Comment } from "../../domain/entities/comment.entity.js";
export interface ImageRecord {
    id: string;
    blob: Blob;
    filename: string;
    mimeType: string;
    size: number;
}
export declare const db: Dexie & {
    boards: EntityTable<Board, "id">;
    states: EntityTable<State, "id">;
    tasks: EntityTable<Task, "id">;
    comments: EntityTable<Comment, "id">;
    images: EntityTable<ImageRecord, "id">;
};
