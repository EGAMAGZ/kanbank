import type { Id } from "../../shared/types/index.js";
import type { Comment } from "../entities/comment.entity.js";
export interface CommentRepository {
  findByTask(taskId: Id<"Task">): Promise<Comment[]>;
  findById(id: Id<"Comment">): Promise<Comment | undefined>;
  create(comment: Comment): Promise<Id<"Comment">>;
  update(
    id: Id<"Comment">,
    changes: Partial<Pick<Comment, "markdown" | "images" | "updatedAt">>,
  ): Promise<void>;
  delete(id: Id<"Comment">): Promise<void>;
}
