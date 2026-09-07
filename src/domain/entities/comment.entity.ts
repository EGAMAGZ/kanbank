import type { Id } from "../../shared/types/id.js";
import type { Timestamped } from "../../shared/types/common.js";
import type { ImageRef } from "../value-objects/image-ref.js";

export interface Comment extends Timestamped {
  id: Id<"Comment">;
  taskId: Id<"Task">;
  markdown: string;
  images: ImageRef[];
}

export interface CreateCommentData {
  id: Id<"Comment">;
  taskId: Id<"Task">;
  markdown: string;
  images?: ImageRef[];
  createdAt: string;
  updatedAt: string;
}

export function createComment(data: CreateCommentData): Comment {
  return {
    id: data.id,
    taskId: data.taskId,
    markdown: data.markdown,
    images: data.images ?? [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}
