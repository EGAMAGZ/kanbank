import { LitElement } from 'lit';
import type { State } from '../../domain/entities/state.entity.js';
import type { Task } from '../../domain/entities/task.entity.js';
export declare class KanbanColumn extends LitElement {
    state: State;
    tasks: Task[];
    taskCount: number;
    dragOver: boolean;
    static styles: import("lit").CSSResult;
    protected createRenderRoot(): HTMLElement | DocumentFragment;
    render(): import("lit").TemplateResult<1>;
}
