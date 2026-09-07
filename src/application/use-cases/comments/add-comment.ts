import { parseOrThrow } from "../../validation.js";
import type { CommentRepository } from "../../../domain/repositories/comment.repository.js";
import type { TaskRepository } from "../../../domain/repositories/task.repository.js";
import { createComment } from "../../../domain/entities/comment.entity.js";
import { generateId } from "../../../shared/types/id.js";
import { toISODate } from "../../../shared/utils/dates.js";
import { eventBus } from "../../../shared/events/event-bus.js";
import {
  type AddCommentInput,
  AddCommentSchema,
} from "../../dto/comment.dto.js";
import {
  EntityNotFoundError,
} from "../../../domain/errors/domain-errors.js";

export class AddCommentUseCase {
  constructor(
    private commentRepo: CommentRepository,
    private taskRepo: TaskRepository,
  ) {}

  async execute(input: AddCommentInput): Promise<string> {
    const parsed = parseOrThrow(AddCommentSchema, input);

    const task = await this.taskRepo.findById(parsed.taskId);
    if (!task) {
      throw new EntityNotFoundError("Task", parsed.taskId);
    }

    const now = toISODate();
    const commentId = generateId<"Comment">();

    const comment = createComment({
      id: commentId,
      taskId: parsed.taskId,
      markdown: parsed.markdown,
      createdAt: now,
      updatedAt: now,
    });

    await this.commentRepo.create(comment);

    await this.taskRepo.update(parsed.taskId, {
      lastActivityAt: now,
      updatedAt: now,
    });

    eventBus.publish("comment.created", comment);
    return commentId;
  }
}
