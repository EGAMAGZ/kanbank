import { css, html, LitElement } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { PageController } from "@open-cells/page-controller";
import { customElement, state } from "lit/decorators.js";
import { liveQuery } from "dexie";
import { CreateBoardUseCase } from "../../application/use-cases/boards/create-board.js";
import { CreateTaskUseCase } from "../../application/use-cases/tasks/create-task.js";
import { DexieBoardRepository } from "../../infrastructure/repositories/dexie-board.repository.js";
import { DexieStateRepository } from "../../infrastructure/repositories/dexie-state.repository.js";
import { DexieTaskRepository } from "../../infrastructure/repositories/dexie-task.repository.js";
import { DexieTimelineRepository } from "../../infrastructure/repositories/dexie-timeline.repository.js";
import type { Board } from "../../domain/entities/board.entity.js";
import type { Task } from "../../domain/entities/task.entity.js";
import type { TimelineEntry } from "../../domain/entities/timeline-entry.entity.js";
import type { Id } from "../../shared/types/id.js";
import { CURRENT_USER } from "../../shared/constants/defaults.js";
import "../../ui/components/keycap.js";
import "../components/bottom-bar.js";
import { isEditableTarget } from "../helpers/shortcuts.js";

const boardRepo = new DexieBoardRepository();
const stateRepo = new DexieStateRepository();
const taskRepo = new DexieTaskRepository();
const timelineRepo = new DexieTimelineRepository();
const createBoard = new CreateBoardUseCase(boardRepo, stateRepo);
const createTask = new CreateTaskUseCase(taskRepo, timelineRepo);

type FeedCol = "added" | "updated" | "done";

interface FeedEvent {
  id: string;
  taskId: string;
  seq: number;
  title: string;
  boardId: string;
  boardTitle: string;
  userId: string;
  userName: string;
  timestamp: string;
  col: FeedCol;
}

interface DayGroup {
  key: string;
  date: Date;
  label: string;
  cols: Record<FeedCol, FeedEvent[]>;
}

const COL_VERBS: Record<FeedCol, string> = {
  added: "added",
  updated: "updated",
  done: "completed",
};

const COLS: FeedCol[] = ["added", "updated", "done"];

function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(d: Date): string {
  const now = new Date();
  const todayKey = localDayKey(now);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const key = localDayKey(d);
  if (key === todayKey) return "Today";
  if (key === localDayKey(yesterday)) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function timeLabel(ts: string): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function colFor(entry: TimelineEntry): FeedCol {
  if (entry.type === "created") return "added";
  if (entry.type === "completed") return "done";
  return "updated";
}

@customElement("board-list-page")
export class BoardListPage extends LitElement {
  pageController = new PageController(this);

  @state()
  private boards: Board[] = [];

  @state()
  private events: FeedEvent[] = [];

  @state()
  private selectedBoardId: string | null = null;

  @state()
  private showBoardSelector = false;

  @state()
  private activeIndex = 0;

  @state()
  private showCardModal = false;

  @state()
  private cardBoardId: string | null = null;

  @state()
  private cardTitle = "";

  @state()
  private cardError: string | null = null;

  @state()
  private showBoardModal = false;

  @state()
  private boardTitle = "";

  private _streamSub: { unsubscribe(): void } | null = null;
  private _boundKeydown?: (e: KeyboardEvent) => void;

  static styles = css`
    :host {
      display: block;
      height: 100%;
      background: var(--color-bg);
      color: var(--color-text);
      overflow-y: auto;
      font-family: var(--font-body);
    }

    .page {
      display: flex;
      flex-direction: column;
      min-height: 100%;
      padding: var(--space-2xl) var(--gutter-lg);
      max-width: var(--max-width);
      margin: 0 auto;
      box-sizing: border-box;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-sm);
      background: var(--color-white);
      border: var(--line-thick) solid var(--color-black);
      box-shadow: var(--shadow-brutal);
      color: var(--color-text);
      font-size: var(--text-sm);
      font-weight: 700;
      padding: var(--space-xs) var(--space-md);
      cursor: pointer;
      transition: transform var(--ease-brutal), box-shadow var(--ease-brutal),
        background var(--ease-brutal);
    }

    .btn:hover {
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0 var(--color-black);
    }

    .btn:active {
      transform: translate(5px, 5px);
      box-shadow: 0 0 0 var(--color-black);
    }

    .btn-primary {
      background: var(--color-accent);
      color: var(--color-white);
      border-color: var(--color-black);
    }

    .btn-primary:hover {
      background: var(--color-accent);
    }

    .title-actions {
      margin-left: auto;
      display: inline-flex;
      gap: var(--space-sm);
    }

    .title {
      font-family: var(--font-display);
      font-size: var(--text-4xl);
      font-weight: 900;
      letter-spacing: -0.04em;
      line-height: var(--leading-tight);
      margin: var(--space-xl) 0 var(--space-lg);
      display: flex;
      align-items: baseline;
      gap: var(--space-md);
      flex-wrap: wrap;
    }

    .title .filter-chip {
      font-size: var(--text-base);
      font-weight: 700;
      color: var(--color-text);
      background: var(--color-white);
      border: var(--line-thick) solid var(--color-black);
      box-shadow: 3px 3px 0 var(--color-black);
      padding: 2px var(--space-sm);
      cursor: pointer;
      position: relative;
      transition: transform var(--ease-brutal), box-shadow var(--ease-brutal);
    }

    .title .filter-chip:hover {
      transform: translate(2px, 2px);
      box-shadow: 1px 1px 0 var(--color-black);
    }

    .all-boards {
      font-weight: 700;
      text-decoration: underline;
      text-underline-offset: 4px;
      cursor: pointer;
      color: var(--color-accent);
      position: relative;
    }

    .all-boards:hover {
      background: var(--color-accent);
      color: var(--color-white);
    }

    .feed {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--space-2xl);
      padding-bottom: var(--space-3xl);
    }

    .day-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
    }

    .day-header {
      display: flex;
      align-items: center;
      gap: var(--space-md);
    }

    .day-label {
      font-family: var(--font-display);
      font-size: var(--text-lg);
      font-weight: 900;
      letter-spacing: -0.02em;
      white-space: nowrap;
      background: var(--color-black);
      color: var(--color-white);
      padding: 2px var(--space-sm);
    }

    .day-line {
      flex: 1;
      height: var(--line-thicker);
      background: var(--color-black);
    }

    .gap-note {
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      color: var(--color-text-3);
      border-left: var(--line-thick) solid var(--color-black);
      padding-left: var(--space-sm);
      margin-top: var(--space-sm);
    }

    .day-cols {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-lg);
    }

    .feed-col {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .col-header {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      font-weight: 700;
      color: var(--color-text-3);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding-bottom: var(--space-xs);
      border-bottom: var(--line-thick) solid var(--color-black);
      display: flex;
      align-items: baseline;
      gap: var(--space-xs);
    }

    .col-header .count {
      color: var(--color-text-3);
      font-weight: 700;
    }

    .cluster {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
    }

    .cluster-time {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-3);
      padding: 2px var(--space-xs);
    }

    .event-card {
      background: var(--color-white);
      border: var(--line-thick) solid var(--color-black);
      box-shadow: var(--shadow-brutal);
      padding: var(--space-sm) var(--space-md);
      transition: transform var(--ease-brutal), box-shadow var(--ease-brutal);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
    }

    .event-card:hover {
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0 var(--color-black);
      background: var(--color-bg);
    }

    .event-card.active {
      background: var(--color-accent);
      border-color: var(--color-accent);
      color: var(--color-white);
      box-shadow: var(--shadow-brutal-lg);
      transform: translate(-2px, -2px);
    }

    .event-card.active .event-body,
    .event-card.active .card-ref,
    .event-card.active .board-ref,
    .event-card.active .sep,
    .event-card.active .actor,
    .event-card.active .task-link {
      color: var(--color-white);
    }

    .event-top {
      display: flex;
      align-items: center;
      gap: var(--space-xs);
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-3);
    }

    .event-top .sep {
      color: var(--color-black);
      font-weight: 900;
    }

    .event-top .card-ref {
      font-weight: 700;
      color: var(--color-black);
    }

    .event-top .board-ref {
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--color-accent);
    }

    .event-body {
      display: flex;
      gap: var(--space-sm);
      align-items: center;
      font-size: var(--text-sm);
      color: var(--color-text);
    }

    .event-body .avatar {
      width: 24px;
      height: 24px;
      min-width: 24px;
      border-radius: 50%;
      background: var(--color-accent-2);
      border: 2px solid var(--color-black);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 800;
      color: var(--color-white);
    }

    .event-body .phrase {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .event-body .actor {
      font-weight: 800;
      color: var(--color-black);
    }

    .event-body .task-link {
      color: var(--color-accent);
      font-weight: 700;
      text-decoration: underline;
      text-underline-offset: 3px;
      cursor: pointer;
    }

    .event-body .task-link:hover {
      background: var(--color-accent);
      color: var(--color-white);
    }

    .feed-end {
      text-align: center;
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      color: var(--color-text-3);
      padding: var(--space-xl) 0 0;
    }

    .empty-state {
      text-align: center;
      color: var(--color-text-3);
      font-family: var(--font-mono);
      font-size: var(--text-base);
      padding: var(--space-3xl) 0;
    }

    /* ---- popovers ---- */

    .popover {
      position: absolute;
      background: var(--color-white);
      border: var(--line-thicker) solid var(--color-black);
      box-shadow: var(--shadow-brutal-md);
      padding: var(--space-xs) 0;
      z-index: 5;
      min-width: 240px;
    }

    .popover-item {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      padding: 8px var(--space-md);
      font-size: var(--text-sm);
      font-weight: 600;
      cursor: pointer;
      color: var(--color-text);
      border-bottom: 2px solid var(--color-black);
      transition: background var(--ease-brutal);
    }

    .popover-item:last-child {
      border-bottom: none;
    }

    .popover-item:hover {
      background: var(--color-accent);
      color: var(--color-white);
    }

    .popover-item.active {
      background: var(--color-bg);
      font-weight: 800;
    }

    .popover-item .avatar {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--color-accent-2);
      color: var(--color-white);
      border: 2px solid var(--color-black);
      font-size: 9px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .popover-item .sub {
      color: var(--color-text-3);
      font-size: var(--text-xs);
    }

    .popover-item:hover .sub {
      color: rgba(255, 255, 255, 0.7);
    }

    /* ---- modals ---- */

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 15vh;
      z-index: 1000;
    }

    .modal-card {
      width: 460px;
      max-width: 92vw;
      background: var(--color-white);
      border: var(--line-thicker) solid var(--color-black);
      box-shadow: var(--shadow-brutal-lg);
      padding: var(--space-xl);
    }

    .modal-card h2 {
      font-family: var(--font-display);
      font-size: var(--text-2xl);
      font-weight: 900;
      letter-spacing: -0.03em;
      margin: 0 0 var(--space-md);
      border-bottom: var(--line-thicker) solid var(--color-black);
      padding-bottom: var(--space-sm);
    }

    .modal-card label {
      display: block;
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      font-weight: 700;
      color: var(--color-text-2);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: var(--space-xs);
    }

    .modal-card select,
    .modal-card input {
      width: 100%;
      box-sizing: border-box;
      background: var(--color-bg);
      border: var(--line-thick) solid var(--color-black);
      color: var(--color-text);
      padding: var(--space-sm) var(--space-md);
      font-size: var(--text-sm);
      margin-bottom: var(--space-md);
      outline: none;
      transition: box-shadow var(--ease-brutal);
    }

    .modal-card select:focus,
    .modal-card input:focus {
      box-shadow: 3px 3px 0 var(--color-accent);
    }

    .modal-error {
      color: var(--color-error);
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: var(--text-sm);
      margin-bottom: var(--space-md);
    }

    .modal-btn-row {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-sm);
    }

    .modal-btn {
      padding: var(--space-sm) var(--space-lg);
      font-size: var(--text-sm);
      font-weight: 700;
      cursor: pointer;
      border: var(--line-thick) solid var(--color-black);
      background: var(--color-white);
      color: var(--color-text);
      box-shadow: var(--shadow-brutal);
      transition: transform var(--ease-brutal), box-shadow var(--ease-brutal),
        background var(--ease-brutal);
    }

    .modal-btn:hover {
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0 var(--color-black);
    }

    .modal-btn.primary {
      background: var(--color-accent);
      color: var(--color-white);
    }

    .modal-btn.primary:hover {
      background: var(--color-accent);
    }

    @media (max-width: 900px) {
      .day-cols {
        grid-template-columns: 1fr;
      }
      .title {
        font-size: var(--text-3xl);
      }
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this._streamSub = liveQuery(async () => {
      const [entries, tasks, boards] = await Promise.all([
        timelineRepo.findAll(),
        taskRepo.findAll(),
        boardRepo.findAll(),
      ]);
      return { entries, tasks, boards };
    }).subscribe({
      next: ({ entries, tasks, boards }) => {
        this._setData(entries, tasks, boards);
      },
      error: (e: Error) => console.error(e),
    });
    this._boundKeydown = this._onKeyDown.bind(this);
    document.addEventListener("keydown", this._boundKeydown);
    window.addEventListener("create-board", this._openBoardModalShortcut);
    window.addEventListener("create-task", this._openCardModalShortcut);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._streamSub?.unsubscribe();
    this._streamSub = null;
    if (this._boundKeydown) {
      document.removeEventListener("keydown", this._boundKeydown);
      this._boundKeydown = undefined;
    }
    window.removeEventListener("create-board", this._openBoardModalShortcut);
    window.removeEventListener("create-task", this._openCardModalShortcut);
  }

  async onPageEnter(): Promise<void> {
    this.showBoardSelector = false;
    this.activeIndex = 0;
  }

  private _setData(
    entries: TimelineEntry[],
    tasks: Task[],
    boards: Board[],
  ): void {
    this.boards = boards;

    const taskById = new Map(tasks.map((t) => [t.id, t]));
    const boardById = new Map(boards.map((b) => [b.id, b]));

    const events: FeedEvent[] = [];
    for (const entry of entries) {
      const task = taskById.get(entry.taskId);
      if (!task) continue;
      const board = boardById.get(task.boardId);
      if (!board) continue;
      events.push({
        id: entry.id,
        taskId: task.id,
        seq: task.seq,
        title: task.title,
        boardId: task.boardId,
        boardTitle: board.title,
        userId: entry.userId,
        userName: entry.userName,
        timestamp: entry.timestamp,
        col: colFor(entry),
      });
    }

    if (
      this.selectedBoardId &&
      !boards.some((b) => b.id === this.selectedBoardId)
    ) {
      this.selectedBoardId = null;
    }
    if (this.selectedBoardId) {
      const filtered = events.filter(
        (e) => e.boardId === this.selectedBoardId,
      );
      this.events = filtered;
    } else {
      this.events = events;
    }

    const count = this.cardEvents.length;
    if (this.activeIndex >= count) {
      this.activeIndex = count > 0 ? count - 1 : 0;
    }
  }

  private get dayGroups(): DayGroup[] {
    const groups: DayGroup[] = [];
    const index = new Map<string, DayGroup>();
    for (const ev of this.events) {
      const d = new Date(ev.timestamp);
      const key = localDayKey(d);
      let g = index.get(key);
      if (!g) {
        g = {
          key,
          date: d,
          label: dayLabel(d),
          cols: { added: [], updated: [], done: [] },
        };
        index.set(key, g);
        groups.push(g);
      }
      g.cols[ev.col].push(ev);
    }
    groups.sort((a, b) => b.date.getTime() - a.date.getTime());
    return groups;
  }

  private get cardEvents(): FeedEvent[] {
    const out: FeedEvent[] = [];
    for (const g of this.dayGroups) {
      for (const c of COLS) out.push(...g.cols[c]);
    }
    return out;
  }

  private get activeEvent(): FeedEvent | undefined {
    return this.cardEvents[this.activeIndex];
  }

  private _openBoardSelector(): void {
    this.showBoardSelector = !this.showBoardSelector;
  }

  private _selectBoard(boardId: string | null): void {
    this.selectedBoardId = boardId;
    this.showBoardSelector = false;
  }

  private _openBoardModalShortcut = (): void => {
    this._openBoardModal();
  };

  private _openCardModalShortcut = (): void => {
    this._openCardModal();
  };

  private _openBoardModal(): void {
    this.boardTitle = "";
    this.showBoardModal = true;
    this.showBoardSelector = false;
  }

  private _closeBoardModal(): void {
    this.showBoardModal = false;
  }

  private async _handleCreateBoard(): Promise<void> {
    if (!this.boardTitle.trim()) return;
    const id = await createBoard.execute({ title: this.boardTitle.trim() });
    this._closeBoardModal();
    this.pageController.navigate("board-detail", { id });
  }

  private _openCardModal(): void {
    this.cardTitle = "";
    this.cardError = null;
    this.cardBoardId = this.selectedBoardId ?? this.boards[0]?.id ?? null;
    this.showCardModal = true;
    this.showBoardSelector = false;
  }

  private _closeCardModal(): void {
    this.showCardModal = false;
  }

  private async _handleCreateCard(): Promise<void> {
    if (!this.cardTitle.trim()) {
      this.cardError = "Title is required";
      return;
    }
    const boardId = this.cardBoardId;
    if (!boardId) {
      this.cardError = "Create a board first";
      return;
    }
    try {
      const states = await stateRepo.findByBoard(boardId as Id<"Board">);
      const sorted = [...states].sort((a, b) => a.order - b.order);
      const maybe = sorted.find((s) => s.title === "Maybe?") ?? sorted[0];
      if (!maybe) {
        this.cardError = "This board has no states";
        return;
      }
      await createTask.execute({
        boardId: boardId as Id<"Board">,
        stateId: maybe.id,
        title: this.cardTitle.trim(),
      });
      this._closeCardModal();
    } catch (e) {
      this.cardError = e instanceof Error ? e.message : "Failed to create card";
    }
  }

  private _selectActive(e: KeyboardEvent, delta: number): void {
    const count = this.cardEvents.length;
    if (count === 0) return;
    e.preventDefault();
    const next = Math.min(Math.max(this.activeIndex + delta, 0), count - 1);
    if (next === this.activeIndex) return;
    this.activeIndex = next;
    void this.updateComplete.then(() => {
      this.renderRoot
        .querySelector(".event-card.active")
        ?.scrollIntoView({ block: "nearest" });
    });
  }

  private _onKeyDown = (e: KeyboardEvent): void => {
    if (this.getAttribute("state") !== "active") return;
    if (isEditableTarget(e)) return;

    switch (e.code) {
      case "KeyC":
        e.preventDefault();
        this._openCardModal();
        break;
      case "KeyB":
        e.preventDefault();
        this._openBoardModal();
        break;
      case "ArrowDown":
        this._selectActive(e, 1);
        break;
      case "ArrowUp":
        this._selectActive(e, -1);
        break;
      case "Enter": {
        const ev = this.activeEvent;
        if (ev) {
          e.preventDefault();
          this._openTask(ev.taskId);
        }
        break;
      }
      case "Escape":
        this.showBoardSelector = false;
        if (this.showCardModal) this._closeCardModal();
        if (this.showBoardModal) this._closeBoardModal();
        break;
    }
  };

  protected updated(changedProperties: Map<PropertyKey, unknown>): void {
    if (
      (changedProperties.has("showCardModal") && this.showCardModal) ||
      (changedProperties.has("showBoardModal") && this.showBoardModal)
    ) {
      requestAnimationFrame(() => {
        const input = this.renderRoot.querySelector(
          ".modal-card input",
        ) as HTMLInputElement | null;
        input?.focus();
      });
    }
  }

  private _renderCol(
    group: DayGroup,
    col: FeedCol,
    counter: { value: number },
  ): unknown {
    const events = group.cols[col];
    return html`
      <div class="feed-col">
        <div class="col-header">
          <span>${col.charAt(0).toUpperCase() + col.slice(1)} ${group.label}</span>
          ${events.length > 0
            ? html`<span class="count">(${events.length})</span>`
            : ""}
        </div>
        ${events.map((ev, i) => {
          const showTime =
            i === 0 || timeLabel(ev.timestamp) !== timeLabel(events[i - 1]!.timestamp);
          const isYou = ev.userId === CURRENT_USER.initials;
          const gi = counter.value++;
          return html`
            <div class="cluster">
              ${showTime
                ? html`<span class="cluster-time">${timeLabel(ev.timestamp)}</span>`
                : ""}
              <div class="event-card ${classMap({ active: gi === this.activeIndex })}"
                @click="${() => this._openTask(ev.taskId)}">
                <div class="event-top">
                  <span class="card-ref">#${ev.seq}</span>
                  <span class="sep">·</span>
                  <span class="board-ref" @click="${(e: Event) => {
                    e.stopPropagation();
                    this._openBoard(ev.boardId);
                  }}">${ev.boardTitle}</span>
                </div>
                <div class="event-body">
                  <span class="avatar">${ev.userId}</span>
                  <span class="phrase">
                    <span class="actor">${isYou ? "You" : ev.userName}</span>
                    ${COL_VERBS[ev.col]}
                    <span class="task-link">${ev.title}</span>
                  </span>
                </div>
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }

  private _openTask(taskId: string): void {
    this.pageController.navigate("task-detail", { id: taskId });
  }

  private _openBoard(boardId: string): void {
    this.pageController.navigate("board-detail", { id: boardId });
  }

  private _renderGapNote(a: DayGroup, b: DayGroup): unknown {
    const dayMs = 86400000;
    const start = (d: Date): number => {
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      return x.getTime();
    };
    const diff = Math.round((start(a.date) - start(b.date)) / dayMs) - 1;
    if (diff < 1) return "";
    return html`
      <div class="gap-note">No activity for ${diff} day${diff === 1 ? "" : "s"}</div>
    `;
  }

  private _selectedBoard(): Board | undefined {
    return this.boards.find((b) => b.id === this.selectedBoardId);
  }

  render() {
    const groups = this.dayGroups;
    const selectedBoard = this._selectedBoard();
    const counter = { value: 0 };

    return html`
      <div class="page">
        <h1 class="title">
          ${selectedBoard
            ? html`
              Latest Activity
              <span class="filter-chip" @click="${this._openBoardSelector}">
                ${selectedBoard.title} ▾
                ${this.showBoardSelector
                  ? html`
                    <div class="popover" style="top:24px;left:0;">
                      <div class="popover-item" @click="${() => this._selectBoard(null)}">
                        All boards
                      </div>
                      ${this.boards.map((b) =>
                        html`
                          <div class="popover-item ${classMap({
                            active: b.id === this.selectedBoardId,
                          })}" @click="${() => this._selectBoard(b.id)}">
                            ${b.title}
                          </div>
                        `
                      )}
                    </div>
                  `
                  : ""}
              </span>
            `
            : html`
              Activity across
              <span class="all-boards" @click="${this._openBoardSelector}" style="position:relative;">all boards
                ${this.showBoardSelector
                  ? html`
                    <div class="popover" style="top:26px;left:0;">
                      <div class="popover-item active" @click="${() => this._selectBoard(null)}">
                        All boards
                      </div>
                      ${this.boards.map((b) =>
                        html`
                          <div class="popover-item" @click="${() => this._selectBoard(b.id)}">
                            ${b.title}
                          </div>
                        `
                      )}
                    </div>
                  `
                  : ""}
              </span>
            `}
          <div class="title-actions">
            <button class="btn btn-primary" @click="${this._openCardModal}">
              Add a card <keycap-el key="C"></keycap-el>
            </button>
            <button class="btn" @click="${this._openBoardModal}">
              Add a board <keycap-el key="B"></keycap-el>
            </button>
          </div>
        </h1>

        <div class="feed">
          ${groups.length === 0
            ? html`<div class="empty-state">
                No activity yet. Add a card to get started.
              </div>`
            : groups.map((g, i) =>
              html`
                <div class="day-group">
                  ${i > 0 ? this._renderGapNote(groups[i - 1]!, g) : ""}
                  <div class="day-header">
                    <span class="day-label">${g.label}</span>
                    <div class="day-line"></div>
                  </div>
                  <div class="day-cols">
                    ${COLS.map((c) => this._renderCol(g, c, counter))}
                  </div>
                </div>
              `
            )}
          ${groups.length > 0
            ? html`<div class="feed-end">No more activity</div>`
            : ""}
        </div>

        <bottom-bar></bottom-bar>

        ${this.showCardModal
          ? html`
            <div class="modal-overlay" @click="${this._closeCardModal}">
              <div class="modal-card" @click="${(e: Event) => e.stopPropagation()}">
                <h2>New card</h2>
                <label for="card-board">Board</label>
                <select id="card-board"
                  .value="${this.cardBoardId ?? ""}"
                  @change="${(e: Event) =>
                    this.cardBoardId = (e.target as HTMLSelectElement).value}">
                  ${this.boards.map(
                    (b) =>
                      html`<option value="${b.id}" ?selected="${b.id === this.cardBoardId}">${b.title}</option>`,
                  )}
                </select>
                <label for="card-title">Title</label>
                <input id="card-title" type="text" placeholder="Card title..."
                  .value="${this.cardTitle}"
                  @input="${(e: Event) =>
                    this.cardTitle = (e.target as HTMLInputElement).value}"
                  @keydown="${(e: KeyboardEvent) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void this._handleCreateCard();
                    }
                    if (e.key === "Escape") this._closeCardModal();
                  }}" />
                ${this.cardError
                  ? html`<div class="modal-error">${this.cardError}</div>`
                  : ""}
                <div class="modal-btn-row">
                  <button class="modal-btn" @click="${this._closeCardModal}">Cancel</button>
                  <button class="modal-btn primary" @click="${this._handleCreateCard}">Create <keycap-el key="⌘↵"></keycap-el></button>
                </div>
              </div>
            </div>
          `
          : ""}
        ${this.showBoardModal
          ? html`
            <div class="modal-overlay" @click="${this._closeBoardModal}">
              <div class="modal-card" @click="${(e: Event) => e.stopPropagation()}">
                <h2>New board</h2>
                <label for="board-title">Title</label>
                <input id="board-title" type="text" placeholder="Board title..."
                  .value="${this.boardTitle}"
                  @input="${(e: Event) =>
                    this.boardTitle = (e.target as HTMLInputElement).value}"
                  @keydown="${(e: KeyboardEvent) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void this._handleCreateBoard();
                    }
                    if (e.key === "Escape") this._closeBoardModal();
                  }}" />
                <div class="modal-btn-row">
                  <button class="modal-btn" @click="${this._closeBoardModal}">Cancel</button>
                  <button class="modal-btn primary" @click="${this._handleCreateBoard}">Create <keycap-el key="⌘↵"></keycap-el></button>
                </div>
              </div>
            </div>
          `
          : ""}
      </div>
    `;
  }
}