import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { State } from "../../domain/entities/state.entity.js";
import type { Task } from "../../domain/entities/task.entity.js";

const COLUMN_COLORS: Record<string, string> = {
  "Not now": "#D4D4D4",
  "Maybe?": "#E5B800",
  "In Progress": "#1E40AF",
  "Done": "#166534",
};

function getColumnColor(state: State): string {
  return COLUMN_COLORS[state.title] ?? state.color;
}

@customElement("kanban-column")
export class KanbanColumn extends LitElement {
  @property({ type: Object })
  state!: State;
  @property({ type: Array })
  tasks: Task[] = [];
  @property({ type: Number })
  taskCount = 0;
  @property({ type: Boolean })
  dragOver = false;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      min-width: 280px;
      max-width: 340px;
      flex-shrink: 0;
      border: var(--line-thicker) solid var(--color-black);
      box-shadow: var(--shadow-brutal-md);
    }

    :host(.drag-over) {
      outline: 3px dashed var(--color-black);
      outline-offset: -3px;
    }

    .col-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-md);
      border-bottom: var(--line-thick) solid var(--color-black);
      background: var(--color-white);
    }

    .col-title {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: var(--text-base);
      letter-spacing: -0.02em;
    }

    .col-count {
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      font-weight: 700;
      border: var(--line-thick) solid var(--color-black);
      padding: 1px var(--space-sm);
      background: var(--color-white);
    }

    .col-body {
      padding: var(--space-sm);
      flex: 1;
      overflow-y: auto;
      min-height: 100px;
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 80px;
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-3);
      border: 2px dashed var(--color-black);
    }
  `;

  render() {
    const colColor = getColumnColor(this.state);
    return html`
      <div class="col-header">
        <span class="col-title">${this.state.title}</span>
        <span class="col-count">${this.taskCount}</span>
      </div>
      <div class="col-body" style="background:${colColor}">
        ${this.tasks.length === 0
          ? html`<div class="empty-state">empty</div>`
          : html`<slot></slot>`}
      </div>
    `;
  }
}
