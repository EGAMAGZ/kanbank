import { Subject, Subscription } from 'rxjs';
import type { DomainEventName } from '../types/events.js';

export interface DomainEvent<T = unknown> {
  name: DomainEventName;
  payload: T;
  timestamp: string;
}

type EventHandler<T = unknown> = (event: DomainEvent<T>) => void;

class DomainEventBusImpl {
  private subjects = new Map<string, Subject<DomainEvent<unknown>>>();

  publish<T>(name: DomainEventName, payload: T): void {
    const subject = this.getOrCreate(name);
    subject.next({ name, payload, timestamp: new Date().toISOString() });
  }

  subscribe<T>(name: DomainEventName, handler: EventHandler<T>): Subscription {
    const subject = this.getOrCreate(name);
    return subject.subscribe(handler as EventHandler<unknown>);
  }

  private getOrCreate(name: string): Subject<DomainEvent<unknown>> {
    if (!this.subjects.has(name)) {
      this.subjects.set(name, new Subject<DomainEvent<unknown>>());
    }
    return this.subjects.get(name)!;
  }
}

export const eventBus = new DomainEventBusImpl();
