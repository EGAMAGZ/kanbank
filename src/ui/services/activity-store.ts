import { eventBus } from "../../shared/events/event-bus.js";

export interface ActivityEvent {
  id: string;
  type: "created" | "moved" | "updated" | "commented" | "completed";
  label: string;
  detail: string;
  taskId: string;
  boardId: string;
  timestamp: string;
  fromStateId?: string;
  toStateId?: string;
  isGold?: boolean;
}

class ActivityStoreImpl {
  private events: ActivityEvent[] = [];
  private maxEvents = 200;

  constructor() {
    eventBus.subscribe("task.created", (event) => {
      const t = event.payload;
      this.add({
        id: crypto.randomUUID(),
        type: "created",
        label: t.title,
        detail: t.description ? t.description.slice(0, 40) : "",
        taskId: t.id,
        boardId: t.boardId,
        timestamp: event.timestamp,
      });
    });

    eventBus.subscribe("task.moved", (event) => {
      const p = event.payload;
      this.add({
        id: crypto.randomUUID(),
        type: "moved",
        label: p.taskId,
        detail: "moved",
        taskId: p.taskId,
        boardId: "",
        fromStateId: p.fromStateId,
        toStateId: p.toStateId,
        timestamp: event.timestamp,
      });
    });

    eventBus.subscribe("task.updated", (event) => {
      const p = event.payload;
      const label = p.title || "task";
      if (p.isGold !== undefined) {
        this.add({
          id: crypto.randomUUID(),
          type: "updated",
          label,
          detail: p.isGold ? "★ golden ticket" : "removed gold",
          taskId: p.id,
          boardId: p.boardId ?? "",
          isGold: p.isGold,
          timestamp: event.timestamp,
        });
      } else {
        this.add({
          id: crypto.randomUUID(),
          type: "updated",
          label,
          detail: p.description ? "description updated" : "updated",
          taskId: p.id,
          boardId: p.boardId ?? "",
          timestamp: event.timestamp,
        });
      }
    });

    eventBus.subscribe("comment.created", (event) => {
      const c = event.payload;
      this.add({
        id: crypto.randomUUID(),
        type: "commented",
        label: "comment",
        detail: c.markdown ? c.markdown.slice(0, 60) : "",
        taskId: c.taskId,
        boardId: "",
        timestamp: event.timestamp,
      });
    });
  }

  private add(ev: ActivityEvent): void {
    this.events.unshift(ev);
    if (this.events.length > this.maxEvents) {
      this.events.length = this.maxEvents;
    }
  }

  getAll(): ActivityEvent[] {
    return [...this.events];
  }
}

export const activityStore = new ActivityStoreImpl();