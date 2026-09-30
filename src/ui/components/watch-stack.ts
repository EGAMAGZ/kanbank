import { css, html, LitElement } from "lit";
import { icon, iconStyle } from "../helpers/icon.js";
import { classMap } from "lit/directives/class-map.js";
import { customElement, state } from "lit/decorators.js";
import { ElementController } from "@open-cells/element-controller";
import { Subscription } from "rxjs";
import { DexieTaskRepository } from "../../infrastructure/repositories/dexie-task.repository.js";
import { DexieBoardRepository } from "../../infrastructure/repositories/dexie-board.repository.js";
import { DexieStateRepository } from "../../infrastructure/repositories/dexie-state.repository.js";
import { eventBus } from "../../shared/events/event-bus.js";
import { isEditableTarget, keycapLabel, mod } from "../helpers/shortcuts.js";
import { watchAlerts } from "../../shared/utils/watch.js";
import { relativeTime } from "../../shared/utils/dates.js";
import type { Task } from "../../domain/entities/task.entity.js";
import type { Board } from "../../domain/entities/board.entity.js";
import type { State } from "../../domain/entities/state.entity.js";

const taskRepo = new DexieTaskRepository();
const boardRepo = new DexieBoardRepository();
const stateRepo = new DexieStateRepository();

const PREVIEW_COUNT = 3;
const ROTATIONS = [5, -3, 2];
const CARD_W = 120;
const CARD_H = 52;
const HOUR_MS = 60 * 60 * 1000;

const STATE_COLORS: Record<string, string> = {
  "Maybe?": "#FFFFFF",
};

function getStateColor(state: State): string {
  return STATE_COLORS[state.title] ?? state.color;
}

@customElement("watch-stack")
export class WatchStack extends LitElement {
  elementController = new ElementController(this);

  @state()
  private expanded = false;

  @state()
  private tasks: Task[] = [];

  @state()
  private boards: Map<string, Board> = new Map();

  @state()
  private states: Map<string, State> = new Map();

  @state()
  private selectedIndex = -1;

  @state()
  private permission = "default";

  private subscriptions: Subscription[] = [];

  static styles = css`${iconStyle}
    :host {
      position: fixed;
      right: var(--space-lg);
      bottom: var(--space-lg);
      z-index: 500;
    }

    /* Mirror of pinned-stack: same cards, fanned leftwards on the right edge. */
    .stack-collapsed {
      position: relative;
      width: ${CARD_W}px;
      height: ${CARD_H + 20}px;
      cursor: pointer;
    }

    .mini-card {
      position: absolute;
      width: ${CARD_W}px;
      height: ${CARD_H}px;
      border: 3px solid var(--color-black);
      background: var(--color-white);
      box-shadow: 3px 3px 0 var(--color-black);
      transition: transform var(--ease-brutal);
      display: flex;
      flex-direction: column;
      padding: 4px 6px;
      box-sizing: border-box;
      overflow: hidden;
      transform: rotate(${ROTATIONS[0]}deg);
      right: 6px;
      top: 0;
    }

    .mini-card.gold {
      background: var(--color-gold);
    }

    .mini-card .mini-state-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
    }

    .mini-card:nth-of-type(2) {
      transform: rotate(${ROTATIONS[1]}deg);
      right: 3px;
      top: 6px;
    }

    .mini-card:nth-of-type(3) {
      transform: rotate(${ROTATIONS[2]}deg);
      right: 0;
      top: 12px;
    }

    .stack-collapsed:hover .mini-card {
      transform: rotate(0deg) translate(-2px, -2px);
    }

    .mini-card .mini-top {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 2px;
    }

    .mini-card .mini-state {
      font-family: var(--font-mono);
      font-size: 7px;
      font-weight: 700;
      border: 1px solid var(--color-black);
      padding: 0 3px;
      white-space: nowrap;
      line-height: 12px;
    }

    .mini-card .mini-idx {
      font-family: var(--font-mono);
      font-size: 7px;
      font-weight: 700;
      color: var(--color-text-3);
    }

    .mini-card .mini-title {
      font-family: var(--font-body);
      font-size: 8px;
      font-weight: 600;
      line-height: 1.2;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      word-break: break-word;
    }

    .stack-badge {
      position: absolute;
      bottom: 10px;
      left: -4px;
      width: 20px;
      height: 20px;
      border: 2px solid var(--color-black);
      background: var(--color-accent);
      color: var(--color-white);
      font-family: var(--font-mono);
      font-size: 9px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }

    .overlay {
      position: fixed;
      inset: 0;
      background: transparent;
      z-index: 499;
    }

    .stack-expanded {
      position: fixed;
      right: var(--space-lg);
      bottom: var(--space-lg);
      width: 360px;
      max-height: 75vh;
      border: none;
      box-shadow: none;
      background: transparent;
      z-index: 500;
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .stack-body {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: calc(var(--space-sm) + 2px);
      padding: 8px 4px 12px;
    }

    .stack-body:empty::after {
      content: "No watched cards";
      display: block;
      padding: var(--space-xl);
      text-align: center;
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-3);
    }

    .watch-item {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      padding: calc(var(--space-md) + 2px);
      margin: 1px 0;
      border: 3px solid var(--color-black);
      cursor: pointer;
      transition: transform var(--ease-brutal), background var(--ease-brutal),
        box-shadow var(--ease-brutal);
      position: relative;
      background: var(--color-white);
      box-shadow: 3px 3px 0 var(--color-black);
    }

    .watch-item:hover,
    .watch-item.is-selected {
      background: var(--color-bg);
      transform: rotate(-2deg) translateY(-2px);
      box-shadow: 4px 4px 0 var(--color-black);
    }

    .watch-item.is-selected {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }

    .watch-item.alerting {
      background: var(--color-gold);
    }

    .watch-item .watch-state-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
    }

    .watch-board-chip {
      font-family: var(--font-mono);
      font-size: 9px;
      font-weight: 700;
      border: 2px solid var(--color-black);
      padding: 1px var(--space-xs);
      background: var(--color-accent);
      color: var(--color-white);
      white-space: nowrap;
      flex-shrink: 0;
    }

    .watch-info {
      flex: 1;
      min-width: 0;
    }

    .watch-title {
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .watch-time {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-3);
    }

    .watch-status {
      font-family: var(--font-mono);
      font-size: 9px;
      font-weight: 700;
      border: 2px dotted var(--color-black);
      padding: 1px var(--space-xs);
      animation: pulse 2s ease-in-out infinite;
      flex-shrink: 0;
    }

    @keyframes pulse {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    .perm-note {
      flex-shrink: 0;
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-error);
      border: 2px dashed var(--color-error);
      background: var(--color-white);
      padding: var(--space-xs) var(--space-sm);
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("keydown", this._handleKeydown);
    window.addEventListener("watch-changed", this._onWatchChanged);
    window.addEventListener("stack-opened", this._onStackOpened);
    this.subscriptions.push(
      eventBus.subscribe("task.updated", () => this._loadData()),
      eventBus.subscribe("task.moved", () => this._loadData()),
    );
    void this._loadData();
    void this._startScheduler();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this._handleKeydown);
    window.removeEventListener("watch-changed", this._onWatchChanged);
    window.removeEventListener("stack-opened", this._onStackOpened);
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  private _onStackOpened = (e: Event): void => {
    if ((e as CustomEvent).detail !== "watch") this._close();
  };

  private _onWatchChanged = (): void => {
    this._loadData();
  };

  private async _loadData(): Promise<void> {
    const all = await taskRepo.findWatched();
    all.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    this.tasks = all;
    const boards = new Map<string, Board>();
    const states = new Map<string, State>();
    for (const id of new Set(all.map((t) => t.boardId))) {
      const b = await boardRepo.findById(id);
      if (b) boards.set(id, b);
    }
    for (const id of new Set(all.map((t) => t.stateId))) {
      const s = await stateRepo.findById(id);
      if (s) states.set(id, s);
    }
    this.boards = boards;
    this.states = states;
    this._syncSelection();
  }

  private _close(): void {
    if (!this.expanded) return;
    this.expanded = false;
    this.selectedIndex = -1;
  }

  toggle(): void {
    if (this.expanded) {
      this._close();
      return;
    }
    this.expanded = true;
    this._syncSelection();
    window.dispatchEvent(new CustomEvent("stack-opened", { detail: "watch" }));
  }

  private _syncSelection(): void {
    if (this.tasks.length === 0) {
      this.selectedIndex = -1;
      return;
    }
    if (this.selectedIndex < 0 || this.selectedIndex >= this.tasks.length) {
      this.selectedIndex = this.tasks.length - 1;
    }
  }

  private _moveSelection(delta: number): void {
    if (this.tasks.length === 0) return;
    this.selectedIndex = Math.max(
      0,
      Math.min(this.tasks.length - 1, this.selectedIndex + delta),
    );
  }

  private _handleKeydown = (e: KeyboardEvent): void => {
    if (isEditableTarget(e)) return;
    if (e.code === "KeyN" && !mod(e) && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      this.toggle();
      window.dispatchEvent(new CustomEvent("close-notif-panel"));
      return;
    }
    if (!this.expanded) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        this._moveSelection(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        this._moveSelection(-1);
        break;
      case "Enter":
        e.preventDefault();
        if (this.selectedIndex >= 0) {
          this._navigate(this.tasks[this.selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        this._close();
        break;
    }
  };

  private _navigate(task: Task): void {
    this.elementController.navigate("task-detail", { id: task.id });
    this._close();
  }

  /** Ask for notification permission from a user gesture, then start the SW. */
  async requestPermission(): Promise<void> {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    this.permission = result;
    this.pingServiceWorker();
  }

  private _refreshPermission(): void {
    if ("Notification" in window) this.permission = Notification.permission;
  }

  private async _startScheduler(): Promise<void> {
    this._refreshPermission();
    if (!("serviceWorker" in navigator)) return;
    try {
      // base-relative so /kanbank/ deployments register the right scope
      const url = new URL("sw.js", document.baseURI).href;
      await navigator.serviceWorker.register(url, { scope: "./" });
      await navigator.serviceWorker.ready;
      this.pingServiceWorker();
      setInterval(() => this.pingServiceWorker(), HOUR_MS);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") this.pingServiceWorker();
      });
    } catch {
      /* no service worker (private mode, plain http) — the panel still lists */
    }
  }

  private pingServiceWorker(): void {
    navigator.serviceWorker?.controller?.postMessage({ type: "watch-check" });
  }

  render() {
    const preview = this.tasks.slice(0, PREVIEW_COUNT);
    const count = this.tasks.length;
    const alerting = this.tasks.filter((t) => watchAlerts(t).length > 0).length;

    return html`
      ${this.expanded
        ? html`
          <div class="overlay" @click="${() => this._close()}"></div>
          <div class="stack-expanded">
            ${this.permission === "denied"
              ? html`<div class="perm-note">
                  Notifications are blocked for this site — watch alerts will
                  not appear.
                </div>`
              : ""}
            <div class="stack-body">
              ${this.tasks.map((task, index) => {
                const alerts = watchAlerts(task);
                const state = this.states.get(task.stateId);
                const isSelected = index === this.selectedIndex;
                return html`
                  <div
                    class=${classMap({
                      "watch-item": true,
                      alerting: alerts.length > 0,
                      "is-selected": isSelected,
                    })}
                    @click="${() => this._navigate(task)}"
                    role="option"
                    aria-selected="${isSelected}">
                    ${state
                      ? html`<div
                          class="watch-state-bar"
                          style="background:${getStateColor(state)}"></div>`
                      : ""}
                    <span class="watch-board-chip">
                      ${this.boards.get(task.boardId)?.title ?? "?"}
                    </span>
                    <div class="watch-info">
                      <div class="watch-title">${task.title}</div>
                      <div class="watch-time">
                        ${alerts.length > 0 ? alerts.join(" · ") : ""}${
                          alerts.length > 0 ? " · " : ""
                        }updated ${relativeTime(task.updatedAt)}${
                          task.dueDate
                            ? ` · due ${task.dueDate.slice(0, 10)}`
                            : ""
                        }
                      </div>
                    </div>
                    ${state
                      ? html`<span class="watch-status">${state.title}</span>`
                      : ""}
                  </div>
                `;
              })}
            </div>
          </div>
        `
        : ""}

      <div
        class="stack-collapsed"
        role="button"
        tabindex="0"
        aria-expanded="${this.expanded}"
        @click="${() => this.toggle()}"
        @keydown="${(e: KeyboardEvent) => {
          if (e.key === "Enter") this.toggle();
        }}"
        title="${`Watched tasks (${keycapLabel("N")})`}">
        ${preview.map((t, i) => {
          const state = this.states.get(t.stateId);
          return html`
            <div class=${classMap({ "mini-card": true, gold: t.isGold })}>
              ${state
                ? html`<div
                    class="mini-state-bar"
                    style="background:${getStateColor(state)}"></div>`
                : ""}
              <div class="mini-top">
                <span class="mini-state">${state?.title ?? "?"}</span>
                <span class="mini-idx">#${i + 1}</span>
              </div>
              <div class="mini-title">${t.title}</div>
            </div>
          `;
        })}
        ${count > 0
          ? html`<span class="stack-badge">${alerting || count}</span>`
          : ""}
        ${count === 0
          ? html`<div
              class="mini-card"
              style="display:flex;align-items:center;justify-content:center;font-size:14px;border-style:dashed;">${icon("visibility")}</div>`
          : ""}
      </div>
    `;
  }
}
