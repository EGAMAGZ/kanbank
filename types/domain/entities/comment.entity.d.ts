import type { Id, Timestamped } from "../../shared/types/index.js";
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
export declare function createComment(data: CreateCommentData): Comment;
