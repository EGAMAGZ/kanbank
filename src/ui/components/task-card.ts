import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Task } from "../../domain/entities/task.entity.js";
import { inactiveDays } from "../../shared/utils/dates.js";

export const CURRENT_USER = { name: "Alex G.", initials: "AG" };

function formatRelative(dateStr: string): string {
  const days = inactiveDays(dateStr);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

@customElement("task-card")
export class TaskCard extends LitElement {
  @property({ type: Object })
  task!: Task;
  @property({ type: Number })
  index = 0;
  @property({ type: String })
  columnColor = "#888";

  static styles = css`
    :host {
      display: block;
    }

    .card {
      border: var(--line-thick) solid var(--color-black);
      box-shadow: var(--shadow-brutal);
      background: var(--color-white);
      padding: var(--space-md);
      cursor: grab;
      transition: transform var(--ease-brutal), box-shadow var(--ease-brutal);
      position: relative;
    }

    .card:active {
      cursor: grabbing;
    }

    .card:hover {
      transform: translate(-2px, -2px);
      box-shadow: 7px 7px 0 var(--color-black);
    }

    .card.gold {
      background: var(--color-gold);
      transform: rotate(-1deg);
      border-width: var(--line-thicker);
      box-shadow: var(--shadow-brutal-lg);
    }

    .card.gold:hover {
      transform: rotate(-1deg) translate(-2px, -2px);
      box-shadow: 10px 10px 0 var(--color-black);
    }

    .card.gold::before {
      content: "★ GOLDEN TICKET";
      display: block;
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      font-weight: 700;
      letter-spacing: 1px;
      border-bottom: var(--line-thick) solid var(--color-black);
      padding-bottom: var(--space-xs);
      margin-bottom: var(--space-sm);
    }

    .meta-row {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      margin-bottom: var(--space-xs);
    }

    .seq-num {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      font-weight: 700;
      color: var(--color-text-2);
    }

    .tag-dot {
      width: 10px;
      height: 10px;
      border: 2px solid var(--color-black);
      flex-shrink: 0;
    }

    .title {
      font-family: var(--font-display);
      font-weight: 700;
      font-size: var(--text-base);
      line-height: var(--leading-snug);
      margin-bottom: var(--space-sm);
      word-break: break-word;
    }

    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 2px solid var(--color-black);
      padding-top: var(--space-xs);
      margin-top: var(--space-xs);
    }

    .avatar {
      width: 24px;
      height: 24px;
      border: 2px solid var(--color-black);
      background: var(--color-accent-2);
      color: var(--color-white);
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .date {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-3);
    }

    .inactive {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-3);
    }

    .inactive.stale {
      color: var(--color-error);
      font-weight: 700;
    }

    .footer-left {
      display: flex;
      align-items: center;
      gap: var(--space-xs);
    }
  `;

  render() {
    const days = inactiveDays(this.task.lastActivityAt);
    return html`
      <div class="card ${this.task.isGold ? "gold" : ""}">
        <div class="meta-row">
          <span class="seq-num">#${String(this.index + 1).padStart(3, "0")}</span>
          <span class="tag-dot" style="background:${this.columnColor}"></span>
        </div>
        <div class="title">${this.task.title}</div>
        <div class="footer">
          <div class="footer-left">
            <span class="avatar">${CURRENT_USER.initials}</span>
            <span class="date">${formatRelative(this.task.createdAt)}</span>
          </div>
          ${days > 3
            ? html`<span class="inactive ${days > 7 ? "stale" : ""}">${days}d idle</span>`
            : days > 0 ? html`<span class="inactive">${days}d idle</span>` : ""}
        </div>
      </div>
    `;
  }
}
