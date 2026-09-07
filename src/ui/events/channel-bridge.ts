import { type DomainEvent, eventBus } from "../../shared/events/event-bus.js";
import { DOMAIN_EVENT_NAMES } from "../../shared/types/events.js";

const CHANNEL_PREFIX = "kanbank:";

export function initChannelBridge(
  publish: (channel: string, value: unknown) => void,
): void {
  for (const name of DOMAIN_EVENT_NAMES) {
    eventBus.subscribe(name, (event: DomainEvent<typeof name>) => {
      publish(`${CHANNEL_PREFIX}${name}`, event.payload);
    });
  }
}