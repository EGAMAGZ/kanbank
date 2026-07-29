import { css, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import { ElementController } from "@open-cells/element-controller";
import { Subscription } from "rxjs";
import { DexieTaskRepository } from "../../infrastructure/repositories/dexie-task.repository.js";
import { DexieBoardRepository } from "../../infrastructure/repositories/dexie-board.repository.js";
import { DexieStateRepository } from "../../infrastructure/repositories/dexie-state.repository.js";
import { eventBus } from "../../shared/events/event-bus.js";
import type { Task } from "../../domain/entities/task.entity.js";
import type { Board } from "../../domain/entities/board.entity.js";
import type { State } from "../../domain/entities/state.entity.js";

const taskRepo = new DexieTaskRepository();
const boardRepo = new DexieBoardRepository();
const stateRepo = new DexieStateRepository();

const PREVIEW_COUNT = 3;
const ROTATIONS = [-5, 3, -2];
const CARD_W = 120;
const CARD_H = 52;

const STATE_COLORS: Record<string, string> = {
  "Maybe?": "#FFFFFF",
};

function getStateColor(state: State): string {
  return STATE_COLORS[state.title] ?? state.color;
}

@customElement("pinned-stack")
export class PinnedStack extends LitElement {
  elementController = new ElementController(this);

  @state()
  private expanded = false;

  @state()
  private tasks: Task[] = [];

  @state()
  private boards: Map<string, Board> = new Map();

  @state()
  private states: Map<string, State> = new Map();

  private subscriptions: Subscription[] = [];

  static styles = css`
    :host {
      position: fixed;
      bottom: var(--space-lg);
      left: var(--space-lg);
      z-index: 500;
    }

    .stack-collapsed {
      display: flex;
      flex-direction: column;
      cursor: pointer;
      position: relative;
      width: ${CARD_W}px;
      height: ${CARD_H + 20}px;
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

    .mini-card:nth-child(1) {
      transform: rotate(${ROTATIONS[0]}deg);
      top: 0;
      left: 6px;
    }

    .mini-card:nth-child(2) {
      transform: rotate(${ROTATIONS[1]}deg);
      top: 6px;
      left: 3px;
    }

    .mini-card:nth-child(3) {
      transform: rotate(${ROTATIONS[2]}deg);
      top: 12px;
      left: 0;
    }

    .stack-collapsed:hover .mini-card {
      transform: rotate(0deg) translate(2px, -2px);
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
      right: -4px;
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
      background: rgba(0, 0, 0, 0.5);
      z-index: 499;
    }

    .stack-expanded {
      position: fixed;
      bottom: var(--space-lg);
      left: var(--space-lg);
      width: 360px;
      max-height: 60vh;
      border: 4px solid var(--color-black);
      box-shadow: 8px 8px 0 var(--color-black);
      background: var(--color-white);
      z-index: 500;
      display: flex;
      flex-direction: column;
    }

    .stack-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-md);
      border-bottom: 4px solid var(--color-black);
      background: var(--color-black);
      color: var(--color-white);
    }

    .stack-header .title {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: var(--text-base);
    }

    .stack-header .close-btn {
      width: 24px;
      height: 24px;
      border: 2px solid var(--color-white);
      background: transparent;
      color: var(--color-white);
      cursor: pointer;
      font-size: 12px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }

    .stack-header .close-btn:hover {
      background: var(--color-white);
      color: var(--color-black);
    }

    .stack-body {
      flex: 1;
      overflow-y: auto;
    }

    .stack-body:empty::after {
      content: "No pinned cards";
      display: block;
      padding: var(--space-xl);
      text-align: center;
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-3);
    }

    .pinned-item {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-md);
      border-bottom: 3px solid var(--color-black);
      cursor: pointer;
      transition: background var(--ease-brutal);
      position: relative;
    }

    .pinned-item:hover {
      background: var(--color-bg);
    }

    .pinned-item .pinned-state-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
    }

    .pinned-item.gold {
      background: var(--color-gold);
    }

    .pinned-item.gold:hover {
      background: #f0c800;
    }

    .pinned-board-chip {
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

    .pinned-info {
      flex: 1;
      min-width: 0;
    }

    .pinned-title {
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .pinned-time {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-3);
    }

    .pinned-status {
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
  `;

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    document.addEventListener("keydown", this._handleKeydown);
    window.addEventListener("pinned-changed", this._onPinnedChanged);
    this.subscriptions.push(
      eventBus.subscribe("task.updated", () => {
        this._loadData();
      }),
      eventBus.subscribe("task.moved", () => {
        this._loadData();
      }),
    );
    await this._loadData();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this._handleKeydown);
    window.removeEventListener("pinned-changed", this._onPinnedChanged);
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  private _onPinnedChanged = (): void => {
    this._loadData();
  };

  private async _loadData(): Promise<void> {
    const all = await taskRepo.findPinned();
    all.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    this.tasks = all;
    const boardIds = new Set(this.tasks.map((t) => t.boardId));
    const stateIds = new Set(this.tasks.map((t) => t.stateId));
    const boards = new Map<string, Board>();
    const states = new Map<string, State>();
    for (const id of boardIds) {
      const b = await boardRepo.findById(id as any);
      if (b) boards.set(id, b);
    }
    for (const id of stateIds) {
      const s = await stateRepo.findById(id as any);
      if (s) states.set(id, s);
    }
    this.boards = boards;
    this.states = states;
  }

  toggle(): void {
    this.expanded = !this.expanded;
  }

  private _toggle(): void {
    this.toggle();
  }

  private _handleKeydown = (e: KeyboardEvent): void => {
    if (e.altKey && (e.key === "p" || e.key === "P")) {
      e.preventDefault();
      this._toggle();
    }
  };

  private _navigate(task: Task): void {
    this.elementController.navigate("task-detail", { id: task.id });
    this.expanded = false;
  }

  private _formatTime(ts: string): string {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    return `${days}d ago`;
  }

  render() {
    const preview = this.tasks.slice(0, PREVIEW_COUNT);
    const count = this.tasks.length;

    return html`
      <div class="stack-collapsed" @click="${this
        ._toggle}" title="Pinned cards (Alt+P)">
        ${preview.map((t, i) => {
          const state = this.states.get(t.stateId);
          return html`
            <div class="mini-card ${t.isGold ? "gold" : ""}">
              ${state
                ? html`<div class="mini-state-bar" style="background:${
                  getStateColor(state)
                }"></div>`
                : ""}
              <div class="mini-top">
                <span class="mini-state">${state?.title ?? "?"}</span>
                <span class="mini-idx">#${i + 1}</span>
              </div>
              <div class="mini-title">${t.title}</div>
            </div>
          `;
        })}
        ${count > 0 ? html`<span class="stack-badge">${count}</span>` : ""}
        ${count === 0
          ? html`
            <div class="mini-card"
              style="display:flex;align-items:center;justify-content:center;font-size:14px;border-style:dashed;">
              📌
            </div>
          `
          : ""}
      </div>

      ${this.expanded && count > 0
        ? html`
          <div class="overlay" @click="${this._toggle}"></div>
          <div class="stack-expanded">
            <div class="stack-header">
              <span class="title">📌 Pinned (${count})</span>
              <button class="close-btn" @click="${this._toggle}">✕</button>
            </div>
            <div class="stack-body">
              ${this.tasks.map((task) => {
                const board = this.boards.get(task.boardId);
                const state = this.states.get(task.stateId);
                return html`
                  <div class="pinned-item ${task.isGold
                    ? "gold"
                    : ""}" @click="${() => this._navigate(task)}">
                    ${state
                      ? html`<div class="pinned-state-bar" style="background:${
                        getStateColor(state)
                      }"></div>`
                      : ""}
                    <span class="pinned-board-chip">${board?.title ??
                      "?"}</span>
                    <div class="pinned-info">
                      <div class="pinned-title">${task.title}</div>
                      <div class="pinned-time">${this._formatTime(
                        task.updatedAt,
                      )}</div>
                    </div>
                    ${state
                      ? html`<span class="pinned-status">${state.title}</span>`
                      : ""}
                  </div>
                `;
              })}
            </div>
          </div>
        `
        : ""}
    `;
  }
}
