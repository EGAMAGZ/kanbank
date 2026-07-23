import { html, LitElement, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { State } from '../../domain/entities/state.entity.js';
import type { Task } from '../../domain/entities/task.entity.js';

@customElement('kanban-column')
export class KanbanColumn extends LitElement {
  @property({ type: Object }) state!: State;
  @property({ type: Array }) tasks: Task[] = [];
  @property({ type: Number }) taskCount = 0;
  @property({ type: Boolean }) dragOver = false;

  static styles = css`
    :host {
      display: block; min-width: 280px; max-width: 320px; flex-shrink: 0;
      background: #f5f5f5; border-radius: 8px; padding: 12px;
    }
    :host(.drag-over) { background: #e0e7ff; }
    .header { font-weight: bold; margin-bottom: 12px; display: flex; justify-content: space-between; }
    .count { color: #666; font-weight: normal; }
  `;

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  render() {
    return html`
      <div class="header">
        <span>${this.state.title}</span>
        <span class="count">${this.taskCount}</span>
      </div>
      <slot></slot>
    `;
  }
}
