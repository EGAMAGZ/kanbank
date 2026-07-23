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
      display: block;
      min-width: 280px;
      max-width: 320px;
      flex-shrink: 0;
      background: var(--color-bg);
      padding: var(--space-md);
    }
    :host(.drag-over) {
      background: rgba(37, 99, 235, 0.06);
    }
    .header {
      font-family: var(--font-display);
      font-weight: 800;
      margin-bottom: var(--space-md);
      display: flex;
      justify-content: space-between;
      letter-spacing: -0.02em;
    }
    .count {
      color: var(--color-text-2);
      font-weight: 500;
    }
  `;

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
