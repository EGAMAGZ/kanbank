import { LitElement } from 'lit';
import type { Task } from '../../domain/entities/task.entity.js';
export declare class TaskCard extends LitElement {
    task: Task;
    static styles: import("lit").CSSResult;
    protected createRenderRoot(): HTMLElement | DocumentFragment;
    render(): import("lit").TemplateResult<1>;
}
