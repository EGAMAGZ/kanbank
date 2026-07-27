import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Task } from "../../domain/entities/task.entity.js";
import { inactiveDays } from "../../shared/utils/dates.js";

@customElement("task-card")
export class TaskCard extends LitElement {
  @property({ type: Object })
  task!: Task;

  static styles = css`
    :host {
      display: block;
      padding: var(--space-md) 0;
      cursor: grab;
      transition: background var(--ease-brutal);
    }

    :host(:last-child) {
      border-bottom: none;
    }

    :host(:hover) {
      background: var(--color-surface);
    }

    :host(:active) {
      cursor: grabbing;
    }

    .title {
      font-size: var(--text-base);
      font-weight: 500;
      line-height: var(--leading-snug);
      margin-bottom: 2px;
    }

    .inactive {
      font-size: var(--text-xs);
      color: var(--color-text-3);
    }

    .inactive.stale {
      color: var(--color-warning);
    }
  `;

  render() {
    const days = inactiveDays(this.task.lastActivityAt);
    return html`
      <div class="title">${this.task.title}</div>
      ${days > 0
        ? html`<div class="inactive ${
          days > 7 ? "stale" : ""
        }">${days}d inactive</div>`
        : ""}
    `;
  }
}
