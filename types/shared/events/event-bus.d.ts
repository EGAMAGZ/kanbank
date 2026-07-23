import { Subscription } from 'rxjs';
import type { DomainEventName } from '../types/events.js';
export interface DomainEvent<T = unknown> {
    name: DomainEventName;
    payload: T;
    timestamp: string;
}
type EventHandler<T = unknown> = (event: DomainEvent<T>) => void;
declare class DomainEventBusImpl {
    private subjects;
    publish<T>(name: DomainEventName, payload: T): void;
    subscribe<T>(name: DomainEventName, handler: EventHandler<T>): Subscription;
    private getOrCreate;
}
export declare const eventBus: DomainEventBusImpl;
export {};
