import type { Id } from "./id.js";
import type { Board } from "../../domain/entities/board.entity.js";
import type { State } from "../../domain/entities/state.entity.js";
import type { Task } from "../../domain/entities/task.entity.js";
import type { Comment } from "../../domain/entities/comment.entity.js";
import type { Step } from "../../domain/entities/step.entity.js";
import type { TimelineEntry } from "../../domain/entities/timeline-entry.entity.js";
import type { ImageRef } from "../../domain/value-objects/image-ref.js";

export const DOMAIN_EVENT_NAMES = [
  "board.created",
  "board.updated",
  "board.deleted",
  "state.created",
  "state.updated",
  "state.deleted",
  "state.reordered",
  "task.created",
  "task.updated",
  "task.deleted",
  "task.moved",
  "task.activity.updated",
  "task.pinned",
  "task.subscribed",
  "comment.created",
  "comment.updated",
  "comment.deleted",
  "image.added",
  "step.created",
  "step.updated",
  "step.deleted",
  "timeline.added",
] as const;

export type DomainEventName = (typeof DOMAIN_EVENT_NAMES)[number];

export interface DomainEventMap {
  "board.created": Board;
  "board.updated": { id: Id<"Board"> } & Partial<
    Pick<
      Board,
      | "title"
      | "description"
      | "autoCloseDays"
      | "autoCloseEnabled"
      | "publicLink"
      | "accessControl"
    >
  >;
  "board.deleted": { id: Id<"Board"> };
  "state.created": State;
  "state.updated": { id: Id<"State"> } & Partial<
    Pick<State, "title" | "color" | "order">
  >;
  "state.deleted": { id: Id<"State">; boardId: Id<"Board"> };
  "state.reordered": { boardId: Id<"Board">; stateIds: Id<"State">[] };
  "task.created": Task;
  "task.updated": { id: Id<"Task"> } & Partial<
    Pick<
      Task,
      | "title"
      | "description"
      | "boardId"
      | "stateId"
      | "pinned"
      | "dueDate"
      | "notNowSince"
      | "isGold"
      | "category"
      | "subscriberIds"
    >
  >;
  "task.deleted": { id: Id<"Task">; boardId: Id<"Board"> };
  "task.moved": {
    taskId: Id<"Task">;
    fromStateId: Id<"State">;
    toStateId: Id<"State">;
    order: number;
  };
  "task.activity.updated": { taskId: Id<"Task"> };
  "task.pinned": { taskId: Id<"Task"> };
  "task.subscribed": { taskId: Id<"Task"> };
  "comment.created": Comment;
  "comment.updated": { id: Id<"Comment">; taskId: Id<"Task"> };
  "comment.deleted": { id: Id<"Comment">; taskId: Id<"Task"> };
  "image.added": {
    taskId?: Id<"Task">;
    commentId?: Id<"Comment">;
    imageRef?: ImageRef;
  };
  "step.created": Step;
  "step.updated": { id: Id<"Step">; taskId: Id<"Task"> } & Partial<
    Pick<Step, "text" | "checked" | "order">
  >;
  "step.deleted": { id: Id<"Step">; taskId: Id<"Task"> };
  "timeline.added": TimelineEntry;
}