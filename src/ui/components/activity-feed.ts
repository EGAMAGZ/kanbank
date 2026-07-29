import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import {
  type ActivityEvent,
  activityStore,
} from "../services/activity-store.js";

function groupByDate(events: ActivityEvent[]): Map<string, ActivityEvent[]> {
  const groups = new Map<string, ActivityEvent[]>();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const ev of events) {
    const d = new Date(ev.timestamp);
    let key: string;
    if (d.toDateString() === today.toDateString()) {
      key = "Today";
    } else if (d.toDateString() === yesterday.toDateString()) {
      key = "Yesterday";
    } else {
      key = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(ev);
  }
  return groups;
}

const TYPE_ICON: Record<string, string> = {
  created: "+",
  moved: "→",
  updated: "✎",
  commented: "💬",
  completed: "✓",
};

@customElement("activity-feed")
export class ActivityFeed extends LitElement {
  @property({ type: Object })
  stateTitles: Record<string, string> = {};

  @property({ type: Object })
  taskTitles: Record<string, string> = {};

  @state()
  private events: ActivityEvent[] = [];

  private _pollTimer: ReturnType<typeof setInterval> | null = null;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      border: var(--line-thicker) solid var(--color-black);
      box-shadow: var(--shadow-brutal-md);
      background: var(--color-white);
      height: 100%;
      overflow: hidden;
    }

    .feed-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-md);
      border-bottom: var(--line-thick) solid var(--color-black);
      flex-shrink: 0;
    }

    .feed-title {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: var(--text-base);
    }

    .feed-badge {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      border: var(--line-thick) solid var(--color-black);
      padding: 1px var(--space-sm);
      background: var(--color-black);
      color: var(--color-white);
    }

    .feed-body {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-sm);
    }

    .feed-body:empty::after {
      content: "No activity yet";
      display: block;
      padding: var(--space-xl);
      text-align: center;
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-3);
    }

    .day-group {
      margin-bottom: var(--space-md);
    }

    .day-label {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      font-weight: 700;
      color: var(--color-text-3);
      border-bottom: 2px solid var(--color-black);
      padding-bottom: var(--space-xs);
      margin-bottom: var(--space-xs);
    }

    .event {
      display: flex;
      gap: var(--space-sm);
      padding: var(--space-xs) 0;
      border-bottom: 1px solid var(--color-black);
      align-items: flex-start;
    }

    .event-icon {
      width: 18px;
      height: 18px;
      border: 2px solid var(--color-black);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-mono);
      font-size: 9px;
      font-weight: 700;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .event-icon.created {
      background: var(--color-success);
      color: var(--color-white);
    }
    .event-icon.moved {
      background: var(--color-accent);
      color: var(--color-white);
    }
    .event-icon.updated {
      background: var(--color-warning);
      color: var(--color-white);
    }
    .event-icon.commented {
      background: var(--color-accent-2);
      color: var(--color-white);
    }
    .event-icon.completed {
      background: var(--color-error);
      color: var(--color-white);
    }

    .event-body {
      flex: 1;
      min-width: 0;
    }

    .event-label {
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .event-detail {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-3);
    }

    .event-time {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-3);
      white-space: nowrap;
      flex-shrink: 0;
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this._poll();
    this._pollTimer = setInterval(() => this._poll(), 2000);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._pollTimer !== null) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
  }

  private _poll(): void {
    this.events = activityStore.getAll();
  }

  private _formatEvent(ev: ActivityEvent): { label: string; detail: string } {
    const taskName = this.taskTitles[ev.taskId];
    const label = taskName || ev.label || "untitled";

    let detail = ev.detail;
    if (ev.type === "moved") {
      const fromName = ev.fromStateId ? this.stateTitles[ev.fromStateId] : null;
      const toName = ev.toStateId ? this.stateTitles[ev.toStateId] : null;
      if (fromName && toName) {
        detail = `${fromName} → ${toName}`;
      } else if (toName) {
        detail = `→ ${toName}`;
      }
    }
    if (ev.type === "created") {
      detail = "created";
    }
    if (ev.type === "commented") {
      detail = ev.detail || "commented";
    }

    return { label, detail };
  }

  render() {
    const groups = groupByDate(this.events);
    return html`
      <div class="feed-header">
        <span class="feed-title">Activity</span>
        <span class="feed-badge">${this.events.length}</span>
      </div>
      <div class="feed-body">
        ${[...groups.entries()].map(([dateLabel, evs]) =>
          html`
            <div class="day-group">
              <div class="day-label">${dateLabel}</div>
              ${evs.map((ev) => {
                const { label, detail } = this._formatEvent(ev);
                return html`
                  <div class="event">
                    <span class="event-icon ${ev.type}">${TYPE_ICON[ev.type] ||
                      "•"}</span>
                    <div class="event-body">
                      <div class="event-label" title="${label}">${label}</div>
                      <div class="event-detail">${detail}</div>
                    </div>
                    <span class="event-time">${new Date(ev.timestamp)
                      .toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}</span>
                  </div>
                `;
              })}
            </div>
          `
        )}
      </div>
    `;
  }
}
