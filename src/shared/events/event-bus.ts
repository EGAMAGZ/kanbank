import { Subject, Subscription } from "rxjs";
import type { DomainEventMap, DomainEventName } from "../types/events.js";

export interface DomainEvent<N extends DomainEventName> {
  name: N;
  payload: DomainEventMap[N];
  timestamp: string;
}

class DomainEventBusImpl {
  private subjects = new Map<string, Subject<unknown>>();

  publish<N extends DomainEventName>(
    name: N,
    payload: DomainEventMap[N],
  ): void {
    const subject = this.getOrCreate(name);
    subject.next({ name, payload, timestamp: new Date().toISOString() });
  }

  subscribe<N extends DomainEventName>(
    name: N,
    handler: (event: DomainEvent<N>) => void,
  ): Subscription {
    const subject = this.getOrCreate(name);
    return subject.subscribe((event) =>
      handler(event as DomainEvent<N>),
    );
  }

  private getOrCreate(name: string): Subject<unknown> {
    if (!this.subjects.has(name)) {
      this.subjects.set(name, new Subject<unknown>());
    }
    return this.subjects.get(name)!;
  }
}

export const eventBus = new DomainEventBusImpl();