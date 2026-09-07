import { parseOrThrow } from "../../validation.js";
import type { CommentRepository } from "../../../domain/repositories/comment.repository.js";
import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import {
  type UpdateCommentInput,
  UpdateCommentSchema,
} from "../../dto/comment.dto.js";
import {
  EntityNotFoundError,
} from "../../../domain/errors/domain-errors.js";
import { toISODate } from "../../../shared/utils/dates.js";
import { eventBus } from "../../../shared/events/event-bus.js";
import type { Id } from "../../../shared/types/id.js";

export class UpdateCommentUseCase {
  constructor(
    private commentRepo: CommentRepository,
    private taskRepo: TaskRepository,
  ) {}

  async execute(id: Id<"Comment">, input: UpdateCommentInput): Promise<void> {
    const parsed = parseOrThrow(UpdateCommentSchema, input);

    const comment = await this.commentRepo.findById(id);
    if (!comment) {
      throw new EntityNotFoundError("Comment", id);
    }

    const now = toISODate();
    await this.commentRepo.update(id, {
      markdown: parsed.markdown,
      updatedAt: now,
    });

    await this.taskRepo.update(comment.taskId, {
      lastActivityAt: now,
      updatedAt: now,
    });

    eventBus.publish("comment.updated", { id, taskId: comment.taskId });
  }
}
