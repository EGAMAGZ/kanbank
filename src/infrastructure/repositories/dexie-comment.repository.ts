import type { Id } from "../../shared/types/index.js";
import type { Comment } from "../../domain/entities/comment.entity.js";
import type { CommentRepository } from "../../domain/repositories/comment.repository.js";
import { db } from "../database/dexie-db.js";

export class DexieCommentRepository implements CommentRepository {
  async findByTask(taskId: Id<"Task">): Promise<Comment[]> {
    return db.comments.where("taskId").equals(taskId).toArray();
  }

  async findById(id: Id<"Comment">): Promise<Comment | undefined> {
    return db.comments.get(id);
  }

  async create(comment: Comment): Promise<Id<"Comment">> {
    await db.comments.add(comment);
    return comment.id;
  }

  async update(
    id: Id<"Comment">,
    changes: Partial<Pick<Comment, "markdown" | "images" | "updatedAt">>,
  ): Promise<void> {
    await db.comments.update(id, changes);
  }

  async delete(id: Id<"Comment">): Promise<void> {
    await db.comments.delete(id);
  }
}
