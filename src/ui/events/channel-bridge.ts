import { type DomainEvent, eventBus } from "../../shared/events/event-bus.js";
import type { DomainEventName } from "../../shared/types/events.js";

const CHANNEL_PREFIX = "kanbank:";

export function initChannelBridge(
  publish: (channel: string, value: unknown) => void,
): void {
  const eventNames: DomainEventName[] = [
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
    "comment.created",
    "comment.updated",
    "comment.deleted",
    "image.added",
  ];

  for (const name of eventNames) {
    eventBus.subscribe(name, (event: DomainEvent) => {
      publish(`${CHANNEL_PREFIX}${name}`, event.payload);
    });
  }
}
