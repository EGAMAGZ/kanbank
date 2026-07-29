import { css, html, LitElement } from "lit";
import { PageController } from "@open-cells/page-controller";
import { customElement, state } from "lit/decorators.js";
import {
  type BoardDetail,
  GetBoardUseCase,
} from "../../application/use-cases/boards/get-board.js";
import { CreateTaskUseCase } from "../../application/use-cases/tasks/create-task.js";
import { MoveTaskUseCase } from "../../application/use-cases/tasks/move-task.js";
import { AutoDiscardCheckUseCase } from "../../application/use-cases/tasks/auto-discard-check.js";
import { CreateStateUseCase } from "../../application/use-cases/states/create-state.js";
import { UpdateStateUseCase } from "../../application/use-cases/states/update-state.js";
import { DeleteStateUseCase } from "../../application/use-cases/states/delete-state.js";
import { ReorderStatesUseCase } from "../../application/use-cases/states/reorder-states.js";
import { DexieBoardRepository } from "../../infrastructure/repositories/dexie-board.repository.js";
import { DexieStateRepository } from "../../infrastructure/repositories/dexie-state.repository.js";
import { DexieTaskRepository } from "../../infrastructure/repositories/dexie-task.repository.js";
import { DexieCommentRepository } from "../../infrastructure/repositories/dexie-comment.repository.js";
import { DexieImageRepository } from "../../infrastructure/storage/image-storage.service.js";
import { DexieStepRepository } from "../../infrastructure/repositories/dexie-step.repository.js";
import { DexieTimelineRepository } from "../../infrastructure/repositories/dexie-timeline.repository.js";
import { UpdateBoardUseCase } from "../../application/use-cases/boards/update-board.js";
import { DeleteBoardUseCase } from "../../application/use-cases/boards/delete-board.js";
import { inactiveDays } from "../../shared/utils/dates.js";
import type { Task } from "../../domain/entities/task.entity.js";
import type { State } from "../../domain/entities/state.entity.js";
import type { Id } from "../../shared/types/index.js";
import "../../ui/components/done-stamp.js";
import "../../ui/components/not-now-stamp.js";
import "../../ui/components/keycap.js";
import { CURRENT_USER } from "../../ui/components/task-card.js";
import "../../ui/components/activity-feed.js";

const boardRepo = new DexieBoardRepository();
const stateRepo = new DexieStateRepository();
const taskRepo = new DexieTaskRepository();
const getBoard = new GetBoardUseCase(boardRepo, stateRepo, taskRepo);
const createTask = new CreateTaskUseCase(taskRepo);
const moveTask = new MoveTaskUseCase(taskRepo);
const autoDiscardCheck = new AutoDiscardCheckUseCase(taskRepo, moveTask);
const createState = new CreateStateUseCase(stateRepo);
const updateState = new UpdateStateUseCase(stateRepo);
const deleteState = new DeleteStateUseCase(stateRepo, taskRepo);
const reorderStates = new ReorderStatesUseCase(stateRepo);
const commentRepo = new DexieCommentRepository();
const imageRepo = new DexieImageRepository();
const stepRepo = new DexieStepRepository();
const timelineRepo = new DexieTimelineRepository();
const updateBoard = new UpdateBoardUseCase(boardRepo);
const deleteBoard = new DeleteBoardUseCase(
  boardRepo,
  stateRepo,
  taskRepo,
  commentRepo,
  imageRepo,
  stepRepo,
  timelineRepo,
);

const COLUMN_COLORS: Record<string, string> = {
  "Not now": "#D4D4D4",
  "Maybe?": "#FFFFFF",
  "In Progress": "#1E40AF",
  "Done": "#166534",
};

function getColColor(state: State): string {
  return COLUMN_COLORS[state.title] ?? state.color;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

@customElement("board-detail-page")
export class BoardDetailPage extends LitElement {
  pageController = new PageController(this);
  params: Record<string, string> = {};

  @state()
  private detail: BoardDetail | null = null;
  @state()
  private error: string | null = null;

  @state()
  private expandedColumnId: string | null = null;

  @state()
  private dragOverStateId = "";

  @state()
  private editingStateId: string | null = null;
  @state()
  private editingStateTitle = "";
  @state()
  private editingStateColor = "#1E40AF";

  @state()
  private showTaskModal = false;
  @state()
  private modalTitle = "";
  @state()
  private modalDescription = "";
  @state()
  private modalError: string | null = null;

  @state()
  private editingBoardTitle = false;
  @state()
  private editingBoardTitleValue = "";

  @state()
  private showActivity = false;

  @state()
  private focusedColIdx = -1;

  @state()
  private focusedTaskIdx = -1;

  private boundKeydown: ((e: KeyboardEvent) => void) | null = null;

  static styles = css`
    :host {
      display: block;
      height: 100%;
      overflow: hidden;
    }

    .board-header {
      padding: var(--space-md) var(--gutter-lg);
      display: flex;
      align-items: center;
      gap: var(--space-md);
      border-bottom: var(--line-thicker) solid var(--color-black);
      background: var(--color-white);
      flex-shrink: 0;
    }

    .board-header .back {
      cursor: pointer;
      font-size: 18px;
      font-weight: 700;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: var(--line-thick) solid var(--color-black);
      background: var(--color-white);
      transition: background var(--ease-brutal);
    }

    .board-header .back:hover {
      background: var(--color-bg);
    }

    .board-header h1 {
      margin: 0;
      flex: 1;
      font-family: var(--font-display);
      font-weight: 900;
      font-size: var(--text-2xl);
      letter-spacing: -0.03em;
    }

    .header-action {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: var(--line-thick) solid var(--color-black);
      background: var(--color-white);
      cursor: pointer;
      font-size: 14px;
      transition: background var(--ease-brutal);
      padding: 0;
    }

    .header-action:hover {
      background: var(--color-bg);
    }

    .header-action--delete:hover {
      background: var(--color-error);
      color: var(--color-white);
    }

    .title-edit-group {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      flex: 1;
    }

    .header-title-input {
      flex: 1;
      font-family: var(--font-display);
      font-weight: 900;
      font-size: var(--text-2xl);
      letter-spacing: -0.03em;
      border: var(--line-thick) solid var(--color-black);
      padding: var(--space-xs) var(--space-sm);
      outline: none;
      background: var(--color-white);
      transition: box-shadow var(--ease-brutal);
      min-width: 200px;
    }

    .header-title-input:focus {
      box-shadow: 3px 3px 0 var(--color-accent);
    }

    .add-column-btn {
      font-size: var(--text-xs);
      font-weight: 700;
      font-family: var(--font-mono);
      cursor: pointer;
      border: var(--line-thick) dashed var(--color-black);
      padding: var(--space-xs) var(--space-sm);
      background: var(--color-white);
      transition: background var(--ease-brutal);
    }

    .add-column-btn:hover {
      background: var(--color-bg);
    }

    /* Columns area */
    .columns {
      display: flex;
      gap: var(--space-md);
      padding: var(--space-md) var(--gutter-lg);
      height: calc(100% - 60px);
      overflow-x: auto;
      overflow-y: hidden;
      align-items: stretch;
    }

    /* --- Collapsed column bar --- */
    .col-bar {
      width: 56px;
      min-width: 56px;
      max-width: 56px;
      border: var(--line-thicker) solid var(--color-black);
      background: var(--color-white);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--space-sm) var(--space-xs);
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: transform var(--ease-brutal), box-shadow var(--ease-brutal);
    }

    .col-bar:hover {
      transform: translate(-2px, -2px);
      box-shadow: 5px 5px 0 var(--color-black);
    }

    .col-bar:active {
      transform: translate(4px, 4px);
      box-shadow: 0 0 0 var(--color-black);
    }

    .col-bar.active {
      background: var(--color-black);
      color: var(--color-white);
    }

    .col-bar .bar-fill {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 0;
      transition: height 0.3s ease-out;
    }

    .col-bar.active .bar-fill {
      background: var(--color-accent) !important;
    }

    .col-bar .bar-badge {
      width: 32px;
      height: 32px;
      border: var(--line-thick) solid var(--color-black);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      font-weight: 700;
      z-index: 1;
      flex-shrink: 0;
      background: var(--color-white);
    }

    .col-bar.active .bar-badge {
      background: var(--color-accent);
      color: var(--color-white);
      border-color: var(--color-white);
    }

    .col-bar .bar-label {
      writing-mode: vertical-rl;
      text-orientation: mixed;
      font-family: var(--font-display);
      font-size: 11px;
      font-weight: 800;
      z-index: 1;
      margin-top: var(--space-sm);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .col-bar .bar-pct {
      font-family: var(--font-mono);
      font-size: 9px;
      font-weight: 700;
      z-index: 1;
      margin-top: auto;
      margin-bottom: var(--space-xs);
    }

    /* --- Expanded column --- */
    .col-expanded {
      width: 320px;
      min-width: 320px;
      max-width: 360px;
      flex-shrink: 0;
      border: var(--line-thicker) solid var(--color-black);
      box-shadow: var(--shadow-brutal-md);
      background: var(--color-white);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .col-expanded.drag-over {
      outline: 4px dashed var(--color-black);
      outline-offset: -4px;
    }

    .col-expanded-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-md);
      border-bottom: var(--line-thick) solid var(--color-black);
      flex-shrink: 0;
    }

    .col-expanded-header .col-title-group {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
    }

    .col-expanded-header .col-title {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: var(--text-base);
      letter-spacing: -0.02em;
    }

    .col-expanded-header .col-count {
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      font-weight: 700;
      border: var(--line-thick) solid var(--color-black);
      padding: 1px var(--space-sm);
      background: var(--color-white);
    }

    .col-expanded-header .col-actions {
      display: flex;
      gap: 2px;
    }

    .col-expanded-header .col-actions button {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--color-black);
      background: var(--color-white);
      cursor: pointer;
      font-size: 10px;
      padding: 0;
      transition: background var(--ease-brutal);
    }

    .col-expanded-header .col-actions button:hover {
      background: var(--color-bg);
    }

    .col-expanded-header .col-actions button:disabled {
      opacity: 0.3;
      cursor: default;
    }

    .col-body {
      padding: var(--space-sm);
      flex: 1;
      overflow-y: auto;
      min-height: 200px;
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .empty-col {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 80px;
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-3);
      border: 2px dashed var(--color-black);
      flex-shrink: 0;
    }

    .col-expanded .add-task-btn {
      display: block;
      width: 100%;
      padding: var(--space-sm);
      flex-shrink: 0;
      border: none;
      border-top: var(--line-thick) solid var(--color-black);
      background: var(--color-white);
      color: var(--color-text-2);
      font-size: var(--text-xs);
      font-weight: 700;
      font-family: var(--font-mono);
      cursor: pointer;
      transition: background var(--ease-brutal), color var(--ease-brutal);
    }

    .col-expanded .add-task-btn:hover {
      background: var(--color-bg);
      color: var(--color-text);
    }

    /* --- Task card --- */
    .task-card {
      border: var(--line-thick) solid var(--color-black);
      box-shadow: var(--shadow-brutal);
      background: var(--color-white);
      padding: var(--space-md);
      cursor: grab;
      transition: transform var(--ease-brutal), box-shadow var(--ease-brutal);
      position: relative;
      flex-shrink: 0;
    }

    .task-card .state-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 5px;
    }

    .task-card:active {
      cursor: grabbing;
    }

    .task-card:hover {
      transform: translate(-2px, -2px);
      box-shadow: 7px 7px 0 var(--color-black);
    }

    .task-card.gold {
      background: var(--color-gold);
      transform: rotate(-1deg);
      border-width: var(--line-thicker);
      box-shadow: var(--shadow-brutal-lg);
    }

    .task-card.gold:hover {
      transform: rotate(-1deg) translate(-2px, -2px);
      box-shadow: 10px 10px 0 var(--color-black);
    }

    .task-card.focused {
      transform: rotate(-1deg);
      box-shadow: 7px 7px 0 var(--color-black);
    }

    .task-card.focused.gold {
      transform: rotate(-2deg);
    }

    .task-card.gold::before {
      content: "★ GOLDEN TICKET";
      display: block;
      font-family: var(--font-mono);
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 1px;
      border-bottom: var(--line-thick) solid var(--color-black);
      padding-bottom: var(--space-xs);
      margin-bottom: var(--space-sm);
    }

    .card-meta {
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

    .card-title {
      font-family: var(--font-display);
      font-weight: 700;
      font-size: var(--text-base);
      line-height: var(--leading-snug);
      margin-bottom: var(--space-sm);
      word-break: break-word;
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 2px solid var(--color-black);
      padding-top: var(--space-xs);
      margin-top: var(--space-xs);
    }

    .card-footer .footer-left {
      display: flex;
      align-items: center;
      gap: var(--space-xs);
    }

    .avatar {
      width: 22px;
      height: 22px;
      border: 2px solid var(--color-black);
      background: var(--color-accent-2);
      color: var(--color-white);
      font-family: var(--font-mono);
      font-size: 9px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .card-date {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-3);
    }

    .card-inactive {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-3);
    }

    .card-inactive.stale {
      color: var(--color-error);
      font-weight: 700;
    }

    /* --- Column form (inline) --- */
    .column-form {
      display: flex;
      gap: var(--space-sm);
      align-items: center;
      padding: var(--space-sm);
      border-top: var(--line-thick) solid var(--color-black);
      flex-shrink: 0;
      background: var(--color-white);
    }

    .column-form input[type="text"] {
      flex: 1;
      padding: var(--space-xs) var(--space-sm);
      border: var(--line-thick) solid var(--color-black);
      font-size: var(--text-xs);
      font-family: var(--font-mono);
      outline: none;
    }

    .column-form input[type="color"] {
      width: 28px;
      height: 28px;
      border: var(--line-thick) solid var(--color-black);
      cursor: pointer;
      padding: 2px;
    }

    .column-form button {
      padding: var(--space-xs) var(--space-sm);
      border: var(--line-thick) solid var(--color-black);
      cursor: pointer;
      background: var(--color-black);
      color: var(--color-white);
      font-size: var(--text-xs);
      font-weight: 700;
      font-family: var(--font-mono);
      transition: background var(--ease-brutal);
    }

    .column-form button:hover {
      background: var(--color-accent);
    }

    .state-edit-input {
      font-size: var(--text-sm);
      font-weight: 700;
      border: var(--line-thick) solid var(--color-black);
      padding: 2px var(--space-xs);
      width: 120px;
      font-family: var(--font-display);
      outline: none;
    }

    .state-edit-color {
      width: 24px;
      height: 24px;
      border: var(--line-thick) solid var(--color-black);
      cursor: pointer;
      padding: 1px;
    }

    /* --- Modal --- */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
    }

    .modal-card {
      background: var(--color-white);
      border: var(--line-thicker) solid var(--color-black);
      box-shadow: var(--shadow-brutal-xl);
      padding: var(--space-xl);
      width: 480px;
      max-height: 80vh;
      overflow-y: auto;
    }

    .modal-card h2 {
      margin: 0 0 var(--space-md);
      font-family: var(--font-display);
      font-size: var(--text-xl);
      font-weight: 900;
      letter-spacing: -0.03em;
    }

    .modal-card label {
      display: block;
      font-size: var(--text-xs);
      font-weight: 700;
      margin-bottom: var(--space-xs);
      font-family: var(--font-mono);
      text-transform: uppercase;
    }

    .modal-card input,
    .modal-card textarea {
      width: 100%;
      padding: var(--space-sm) var(--space-md);
      border: var(--line-thick) solid var(--color-black);
      box-sizing: border-box;
      font-size: var(--text-sm);
      font-family: var(--font-body);
      outline: none;
      background: var(--color-white);
    }

    .modal-card input:focus,
    .modal-card textarea:focus {
      box-shadow: 3px 3px 0 var(--color-accent);
    }

    .modal-card textarea {
      min-height: 100px;
      resize: vertical;
      margin-top: var(--space-xs);
    }

    .modal-card .modal-btn-row {
      display: flex;
      gap: var(--space-sm);
      margin-top: var(--space-lg);
      flex-wrap: wrap;
    }

    .modal-card .modal-error {
      color: var(--color-error);
      font-size: var(--text-sm);
      margin-top: var(--space-md);
      font-family: var(--font-mono);
    }

    .btn {
      padding: var(--space-sm) var(--space-md);
      border: var(--line-thick) solid var(--color-black);
      cursor: pointer;
      font-size: var(--text-sm);
      font-weight: 700;
      font-family: var(--font-mono);
      transition: transform var(--ease-brutal), box-shadow var(--ease-brutal);
    }

    .btn-primary {
      box-shadow: var(--shadow-brutal);
      background: var(--color-accent);
      color: var(--color-white);
    }

    .btn-primary:hover {
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0 var(--color-black);
    }

    .btn-primary:active {
      transform: translate(5px, 5px);
      box-shadow: 0 0 0 var(--color-black);
    }

    .btn-cancel {
      box-shadow: none;
      background: var(--color-white);
      color: var(--color-text);
    }

    .btn-cancel:hover {
      background: var(--color-bg);
    }

    .board-body {
      display: flex;
      height: calc(100% - 60px);
      overflow: hidden;
    }

    .columns-wrap {
      display: flex;
      gap: var(--space-md);
      padding: var(--space-md) var(--gutter-lg);
      overflow-x: auto;
      overflow-y: hidden;
      align-items: stretch;
      flex: 1;
      min-width: 0;
    }

    .activity-panel {
      width: 320px;
      min-width: 320px;
      border-left: var(--line-thicker) solid var(--color-black);
      flex-shrink: 0;
      overflow: hidden;
    }

    .activity-toggle {
      font-size: var(--text-xs);
      font-weight: 700;
      font-family: var(--font-mono);
      cursor: pointer;
      border: var(--line-thick) solid var(--color-black);
      padding: var(--space-xs) var(--space-sm);
      background: var(--color-white);
      transition: background var(--ease-brutal);
      margin-left: var(--space-sm);
    }

    .activity-toggle:hover {
      background: var(--color-bg);
    }

    .activity-toggle.active {
      background: var(--color-accent);
      color: var(--color-white);
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.boundKeydown = this.handleKeydown.bind(this);
    document.addEventListener("keydown", this.boundKeydown);
    window.addEventListener("create-task", this._handleCreateTaskShortcut);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.boundKeydown) {
      document.removeEventListener("keydown", this.boundKeydown);
      this.boundKeydown = null;
    }
    window.removeEventListener("create-task", this._handleCreateTaskShortcut);
  }

  private _handleCreateTaskShortcut = (): void => {
    if (this.detail) {
      const maybeState = this.getSortedStates().find((s) =>
        s.id === this.getMandatoryOrder().maybe
      );
      if (maybeState) this.openTaskModal();
    }
  };

  private async handleAutoCreateState(): Promise<void> {
    if (!this.detail) return;
    try {
      const sorted = this.getSortedStates();
      const mandatory = this.getMandatoryOrder();
      const doneState = sorted.find((s) => s.id === mandatory.last);
      const order = doneState ? doneState.order : sorted.length;
      const newStateId = await createState.execute({
        boardId: this.detail.board.id,
        title: "New state",
        color: "#1E40AF",
        order,
      });
      const newStateIds = sorted.map((s) => s.id);
      const doneIndex = newStateIds.indexOf(mandatory.last);
      newStateIds.splice(doneIndex, 0, newStateId as Id<"State">);
      await reorderStates.execute({
        boardId: this.detail.board.id,
        stateIds: newStateIds,
      });
      await this.loadBoard();
      const states = this.detail?.states ?? [];
      const created = states.find((s) => s.id === newStateId);
      if (created) {
        this.startEditState(created);
        await this.updateComplete;
        const input = this.renderRoot.querySelector(
          ".state-edit-input",
        ) as HTMLInputElement;
        if (input) input.focus();
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to create state";
    }
  }

  async onPageEnter(): Promise<void> {
    this.focusedColIdx = -1;
    this.focusedTaskIdx = -1;
    await this.loadBoard();
  }

  private getMandatoryOrder(): {
    first: Id<"State">;
    maybe: Id<"State">;
    last: Id<"State">;
  } {
    if (!this.detail) {
      return {
        first: "" as Id<"State">,
        maybe: "" as Id<"State">,
        last: "" as Id<"State">,
      };
    }
    const sorted = [...this.detail.states].sort((a, b) => a.order - b.order);
    return {
      first: sorted[0]?.id ?? ("" as Id<"State">),
      maybe: sorted[1]?.id ?? ("" as Id<"State">),
      last: sorted[sorted.length - 1]?.id ?? ("" as Id<"State">),
    };
  }

  private getSortedStates(): State[] {
    if (!this.detail) return [];
    return [...this.detail.states].sort((a, b) => a.order - b.order);
  }

  private getMaxTaskCount(): number {
    if (!this.detail) return 1;
    const counts = Object.values(this.detail.taskCounts);
    return Math.max(...counts, 1);
  }

  private async loadBoard(): Promise<void> {
    const id = this.params?.id;
    if (!id) return;
    try {
      this.error = null;
      this.detail = await getBoard.execute(id as any);
      if (this.detail) {
        const discarded = await autoDiscardCheck.execute(
          this.detail.tasks,
          this.detail.states,
        );
        if (discarded > 0) {
          this.detail = await getBoard.execute(id as any);
        }
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to load board";
    }
  }

  private handleEditBoardTitle(): void {
    if (!this.detail) return;
    this.editingBoardTitleValue = this.detail.board.title;
    this.editingBoardTitle = true;
  }

  private async handleSaveBoardTitle(): Promise<void> {
    if (!this.detail || !this.editingBoardTitleValue.trim()) return;
    try {
      await updateBoard.execute(this.detail.board.id, {
        title: this.editingBoardTitleValue.trim(),
      });
      this.editingBoardTitle = false;
      await this.loadBoard();
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to update title";
    }
  }

  private handleCancelBoardTitle(): void {
    this.editingBoardTitle = false;
    this.editingBoardTitleValue = "";
  }

  private async handleDeleteBoard(): Promise<void> {
    if (!this.detail) return;
    if (
      !confirm(
        `Delete "${this.detail.board.title}"? All states, tasks, and images will be permanently removed.`,
      )
    ) return;
    try {
      await deleteBoard.execute(this.detail.board.id);
      this.pageController.navigate("home");
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to delete board";
    }
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (!this.detail) return;
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) return;

    const sorted = this.getSortedStates();
    const mandatory = this.getMandatoryOrder();
    const maybeIdx = sorted.findIndex((s) => s.id === mandatory.maybe);

    if (e.key === "Escape") {
      if (this.showTaskModal) {
        this.closeTaskModal();
      } else {
        this.expandedColumnId = null;
        this.focusedColIdx = -1;
        this.focusedTaskIdx = -1;
      }
      return;
    }

    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const currentIdx = this.focusedColIdx >= 0
        ? this.focusedColIdx
        : this.expandedColumnId
        ? sorted.findIndex((s) => s.id === this.expandedColumnId)
        : maybeIdx;
      const delta = e.key === "ArrowLeft" ? -1 : 1;
      const nextIdx = (currentIdx + delta + sorted.length) % sorted.length;
      const nextState = sorted[nextIdx];
      if (nextState) {
        if (nextState.id !== mandatory.maybe) {
          this.expandedColumnId = nextState.id;
        } else {
          this.expandedColumnId = null;
        }
      }
      this.focusedColIdx = nextIdx;
      this.focusedTaskIdx = 0;
      requestAnimationFrame(() => this._focusCurrentTask());
      return;
    }

    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      if (this.focusedColIdx < 0) return;
      const state = sorted[this.focusedColIdx];
      if (!state) return;
      const tasks = this._getStateTasks(state.id);
      if (tasks.length === 0) return;
      e.preventDefault();
      const delta = e.key === "ArrowUp" ? -1 : 1;
      this.focusedTaskIdx = Math.max(
        0,
        Math.min(tasks.length - 1, this.focusedTaskIdx + delta),
      );
      requestAnimationFrame(() => this._focusCurrentTask());
      return;
    }

    if (e.key === "Enter") {
      if (this.focusedColIdx < 0 || this.focusedTaskIdx < 0) return;
      const state = sorted[this.focusedColIdx];
      if (!state) return;
      const tasks = this._getStateTasks(state.id);
      const task = tasks[this.focusedTaskIdx];
      if (task) {
        e.preventDefault();
        this.selectTask(task);
      }
      return;
    }
  }

  private _getStateTasks(stateId: string): Task[] {
    if (!this.detail) return [];
    return this.detail.tasks
      .filter((t) => t.stateId === stateId)
      .sort((a, b) => {
        if (a.isGold !== b.isGold) return a.isGold ? -1 : 1;
        return new Date(a.lastActivityAt).getTime() -
          new Date(b.lastActivityAt).getTime();
      });
  }

  private _focusCurrentTask(): void {
    if (this.focusedColIdx < 0 || this.focusedTaskIdx < 0) return;
    const card = this.renderRoot.querySelector<HTMLElement>(
      ".task-card.focused",
    );
    if (card) card.focus();
  }

  private toggleColumn(stateId: string): void {
    const mandatory = this.getMandatoryOrder();
    if (stateId === mandatory.maybe) return;
    this.expandedColumnId = this.expandedColumnId === stateId ? null : stateId;
  }

  private handleDragStart(e: DragEvent, task: Task): void {
    e.dataTransfer?.setData("text/plain", task.id);
    e.dataTransfer?.setData("application/x-kanbank-from-state", task.stateId);
  }

  private handleDragOver(e: DragEvent, stateId: string): void {
    e.preventDefault();
    this.dragOverStateId = stateId;
  }

  private handleDragLeave(): void {
    this.dragOverStateId = "";
  }

  private async handleDrop(e: DragEvent, stateId: string): Promise<void> {
    e.preventDefault();
    this.dragOverStateId = "";
    const taskId = e.dataTransfer?.getData("text/plain");
    if (!taskId || !this.detail) return;
    const targetState = this.detail.states.find((s) => s.id === stateId);
    const targetIsNotNow = targetState?.title === "Not now";
    const tasksInColumn = this.detail.tasks.filter((t) =>
      t.stateId === stateId
    );
    await moveTask.execute({
      taskId,
      newStateId: stateId,
      order: tasksInColumn.length,
    }, { targetIsNotNow });
    await this.loadBoard();
  }

  private selectTask(task: Task): void {
    this.pageController.navigate("task-detail", { id: task.id });
  }

  private startEditState(state: State): void {
    this.editingStateId = state.id;
    this.editingStateTitle = state.title;
    this.editingStateColor = state.color;
  }

  private async saveEditState(state: State): Promise<void> {
    if (!this.editingStateTitle.trim()) return;
    try {
      await updateState.execute(state.id, {
        title: this.editingStateTitle.trim(),
        color: this.editingStateColor,
      });
      this.editingStateId = null;
      await this.loadBoard();
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to update state";
    }
  }

  private cancelEditState(): void {
    this.editingStateId = null;
  }

  private async handleDeleteState(state: State): Promise<void> {
    if (!confirm(`Delete "${state.title}"? Tasks will be moved to Maybe?`)) {
      return;
    }
    try {
      await deleteState.execute(state.id);
      await this.loadBoard();
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to delete state";
    }
  }

  private canMoveState(state: State): { left: boolean; right: boolean } {
    if (!this.detail) return { left: false, right: false };
    const mandatory = this.getMandatoryOrder();
    const isMandatory = state.id === mandatory.first ||
      state.id === mandatory.maybe || state.id === mandatory.last;
    if (isMandatory) return { left: false, right: false };
    const sorted = this.getSortedStates();
    const idx = sorted.findIndex((s) => s.id === state.id);
    const maybeIdx = sorted.findIndex((s) => s.id === mandatory.maybe);
    const doneIdx = sorted.findIndex((s) => s.id === mandatory.last);
    return { left: idx > maybeIdx + 1, right: idx < doneIdx - 1 };
  }

  private async moveStateLeft(state: State): Promise<void> {
    if (!this.detail) return;
    const sorted = this.getSortedStates();
    const idx = sorted.findIndex((s) => s.id === state.id);
    if (idx <= 0) return;
    const stateIds = sorted.map((s) => s.id);
    [stateIds[idx - 1], stateIds[idx]] = [stateIds[idx], stateIds[idx - 1]];
    try {
      await reorderStates.execute({ boardId: this.detail.board.id, stateIds });
      await this.loadBoard();
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to reorder states";
    }
  }

  private async moveStateRight(state: State): Promise<void> {
    if (!this.detail) return;
    const sorted = this.getSortedStates();
    const idx = sorted.findIndex((s) => s.id === state.id);
    if (idx < 0 || idx >= sorted.length - 1) return;
    const stateIds = sorted.map((s) => s.id);
    [stateIds[idx], stateIds[idx + 1]] = [stateIds[idx + 1], stateIds[idx]];
    try {
      await reorderStates.execute({ boardId: this.detail.board.id, stateIds });
      await this.loadBoard();
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to reorder states";
    }
  }

  private openTaskModal(): void {
    this.modalTitle = "";
    this.modalDescription = "";
    this.modalError = null;
    this.showTaskModal = true;
  }

  private closeTaskModal(): void {
    this.showTaskModal = false;
    this.modalTitle = "";
    this.modalDescription = "";
    this.modalError = null;
  }

  private async handleModalCreate(
    stateId: string,
    mode: "close" | "another" | "duplicate",
  ): Promise<void> {
    if (!this.modalTitle.trim() || !this.detail) return;
    try {
      this.modalError = null;
      const description = this.modalDescription.trim() || undefined;
      await createTask.execute({
        boardId: this.detail.board.id,
        stateId,
        title: this.modalTitle.trim(),
        description,
      });
      if (mode === "close") {
        this.closeTaskModal();
      } else if (mode === "another") {
        this.modalTitle = "";
        this.modalDescription = "";
      } else {
        this.modalTitle = "";
        this.modalDescription = description ?? "";
      }
      await this.loadBoard();
    } catch (e) {
      this.modalError = e instanceof Error
        ? e.message
        : "Failed to create task";
    }
  }

  private renderTaskCard(
    task: Task,
    colColor: string,
    stateIdx: number,
    taskIdx: number,
  ): unknown {
    const days = inactiveDays(task.lastActivityAt);
    const mandatory = this.getMandatoryOrder();
    const isDone = task.stateId === mandatory.last;
    const isNotNow = task.stateId === mandatory.first;
    const boardSettings = this.detail?.board;
    const autoCloseDays = boardSettings?.autoCloseEnabled
      ? boardSettings.autoCloseDays
      : null;
    const daysUntilAutoClose = autoCloseDays !== null
      ? autoCloseDays - days
      : null;
    const isFocused = this.focusedColIdx === stateIdx &&
      this.focusedTaskIdx === taskIdx;
    return html`
      <div
        class="task-card ${task.isGold ? "gold" : ""} ${isFocused
          ? "focused"
          : ""}"
        tabindex="-1"
        draggable="true"
        @dragstart="${(e: DragEvent) => this.handleDragStart(e, task)}"
        @click="${() => this.selectTask(task)}"
      >
        <div class="state-bar" style="background:${colColor}"></div>
        ${isDone
          ? html`
            <done-stamp date="${formatDate(
              task.updatedAt,
            )}" author="${CURRENT_USER.initials}"
              bg-color="#166534"></done-stamp>
          `
          : ""}
        ${isNotNow
          ? html`
            <not-now-stamp date="${formatDate(
              task.notNowSince ?? task.updatedAt,
            )}" author="${task.notNowSince ? "System" : CURRENT_USER.initials}"
              bg-color="#8C8C8C"></not-now-stamp>
          `
          : ""}
        <div class="card-meta">
          <span class="seq-num">#${String(task.seq).padStart(3, "0")}</span>
          <span class="tag-dot" style="background:${colColor}"></span>
        </div>
        <div class="card-title">${task.title}</div>
        ${daysUntilAutoClose !== null && daysUntilAutoClose > 0 && !isNotNow &&
            !isDone
          ? html`
            <div
              style="font-family:var(--font-mono);font-size:9px;color:var(--color-text-3);margin-bottom:var(--space-xs);">→ Not now in ${daysUntilAutoClose}d</div>
          `
          : ""}
        <div class="card-footer">
          <div class="footer-left">
            <span class="avatar">${CURRENT_USER.initials}</span>
            <span class="card-date">${formatDate(task.createdAt)}</span>
          </div>
          ${days > 3
            ? html`<span class="card-inactive ${
              days > 7 ? "stale" : ""
            }">${days}d idle</span>`
            : days > 0
            ? html`<span class="card-inactive">${days}d idle</span>`
            : ""}
        </div>
      </div>
    `;
  }

  private renderBar(state: State): unknown {
    if (!this.detail) return html``;
    const count = this.detail.taskCounts[state.id] ?? 0;
    const max = this.getMaxTaskCount();
    const pct = Math.round((count / max) * 100);
    const isActive = this.expandedColumnId === state.id;
    const mandatory = this.getMandatoryOrder();
    const isNotNow = state.id === mandatory.first;
    const colColor = getColColor(state);

    return html`
      <div
        class="col-bar ${isActive
          ? "active"
          : ""} ${this.dragOverStateId === state.id ? "drag-over" : ""}"
        @click="${() => this.toggleColumn(state.id)}"
        @dragover="${(e: DragEvent) => this.handleDragOver(e, state.id)}"
        @dragleave="${() => this.handleDragLeave()}"
        @drop="${(e: DragEvent) => this.handleDrop(e, state.id)}"
      >
        <div class="bar-fill" style="height: ${isNotNow
          ? 100
          : pct}%; background: ${isNotNow
          ? "var(--color-notnow)"
          : colColor}"></div>
        <div class="bar-badge">${count}</div>
        <div class="bar-label">${state.title}</div>
        ${!isNotNow ? html`<div class="bar-pct">${pct}%</div>` : ""}
      </div>
    `;
  }

  private renderExpanded(state: State): unknown {
    if (!this.detail) return html``;
    const stateTasks = this._getStateTasks(state.id);
    const stateIdx = this.getSortedStates().findIndex((s) => s.id === state.id);
    const mandatory = this.getMandatoryOrder();
    const isMandatory = state.id === mandatory.first ||
      state.id === mandatory.maybe || state.id === mandatory.last;
    const colColor = getColColor(state);

    return html`
      <div
        class="col-expanded ${this.dragOverStateId === state.id
          ? "drag-over"
          : ""}"
        @dragover="${(e: DragEvent) => this.handleDragOver(e, state.id)}"
        @dragleave="${() => this.handleDragLeave()}"
        @drop="${(e: DragEvent) => this.handleDrop(e, state.id)}"
      >
        <div class="col-expanded-header" style="background:${colColor}">
          <div class="col-title-group">
            ${this.editingStateId === state.id
              ? html`
                <input class="state-edit-input" type="text" .value="${this
                  .editingStateTitle}"
                  @input="${(e: Event) => {
                    this.editingStateTitle =
                      (e.target as HTMLInputElement).value;
                  }}"
                  @keydown="${(e: KeyboardEvent) => {
                    if (e.key === "Enter") this.saveEditState(state);
                    if (e.key === "Escape") this.cancelEditState();
                  }}"
                />
                <input class="state-edit-color" type="color" .value="${this
                  .editingStateColor}"
                  @input="${(e: Event) => {
                    this.editingStateColor =
                      (e.target as HTMLInputElement).value;
                  }}"
                  @change="${() => this.saveEditState(state)}"
                />
              `
              : html`<span class="col-title">${state.title}</span>`}
            <span class="col-count">${this.detail.taskCounts[state.id] ??
              0}</span>
          </div>
          <div class="col-actions">
            <button @click="${() =>
              this.startEditState(state)}" title="Edit">✎</button>
            ${!isMandatory
              ? html`
                <button @click="${() =>
                  this.handleDeleteState(state)}" title="Delete">✕</button>
                ${(() => {
                  const { left, right } = this.canMoveState(state);
                  return html`
                    <button ?disabled="${!left}" @click="${() =>
                      this.moveStateLeft(state)}"
                      title="Move left">◀</button>
                    <button ?disabled="${!right}" @click="${() =>
                      this.moveStateRight(state)}"
                      title="Move right">▶</button>
                  `;
                })()}
              `
              : ""}
            ${state.id !== mandatory.maybe
              ? html`<button @click="${() => {
                this.expandedColumnId = null;
              }}" title="Collapse">▶</button>`
              : ""}
          </div>
        </div>
        <div class="col-body">
          ${stateTasks.length === 0
            ? html`<div class="empty-col">empty</div>`
            : stateTasks.map((task, taskIdx) =>
              this.renderTaskCard(task, colColor, stateIdx, taskIdx)
            )}
        </div>
        ${state.id === mandatory.maybe
          ? html`
            <button class="add-task-btn"
              @click="${() =>
                this
                  .openTaskModal()}">+ ADD TASK <keycap-el key="⎇T"></keycap-el></button>
          `
          : ""}

      </div>
    `;
  }

  render() {
    if (this.error) {
      return html`
        <div
          style="padding:var(--space-xl);color:var(--color-error);font-family:var(--font-mono);">Error: ${this
            .error}</div>
      `;
    }
    if (!this.detail) {
      return html`
        <div
          style="padding:var(--space-xl);color:var(--color-text-3);font-family:var(--font-mono);">Loading...</div>
      `;
    }

    const { board } = this.detail;
    const sorted = this.getSortedStates();
    const mandatory = this.getMandatoryOrder();
    const maybeState = sorted.find((s) => s.id === mandatory.maybe);
    const leftStates = sorted.filter((s) => s.order < (maybeState?.order ?? 1));
    const rightStates = sorted.filter((s) =>
      s.order > (maybeState?.order ?? 1)
    );

    return html`
      <div class="board-header">
        <span class="back" @click="${() =>
          this.pageController.navigate("home")}">←</span>
        ${this.editingBoardTitle
          ? html`
            <div class="title-edit-group">
              <input class="header-title-input" type="text" .value="${this
                .editingBoardTitleValue}"
                @input="${(e: Event) => {
                  this.editingBoardTitleValue =
                    (e.target as HTMLInputElement).value;
                }}"
                @keydown="${(e: KeyboardEvent) => {
                  if (e.key === "Enter") this.handleSaveBoardTitle();
                  if (e.key === "Escape") this.handleCancelBoardTitle();
                }}"
              />
              <button class="header-action" @click="${this
                .handleSaveBoardTitle}" title="Save">✓</button>
              <button class="header-action" @click="${this
                .handleCancelBoardTitle}" title="Cancel">✕</button>
            </div>
          `
          : html`
            <h1>${board.title}</h1>
            <button class="header-action" @click="${() =>
              this.handleEditBoardTitle()}" title="Edit title">✎</button>
            <button class="header-action header-action--delete" @click="${() =>
              this.handleDeleteBoard()}"
              title="Delete board">🗑</button>
          `}
        <button class="add-column-btn" @click="${() =>
          this.handleAutoCreateState()}">+ ESTADO</button>
        <button class="activity-toggle ${this.showActivity
          ? "active"
          : ""}" @click="${() => this.showActivity = !this.showActivity}">
          ${this.showActivity ? "HIDE FEED" : "FEED"}
        </button>
      </div>

      <div class="board-body">
        <div class="columns-wrap">
          ${leftStates.map((s) =>
            this.expandedColumnId === s.id
              ? this.renderExpanded(s)
              : this.renderBar(s)
          )}
          ${maybeState ? this.renderExpanded(maybeState) : ""}
          ${rightStates.map((s) =>
            this.expandedColumnId === s.id
              ? this.renderExpanded(s)
              : this.renderBar(s)
          )}
        </div>
        ${this.showActivity
          ? html`
            <div class="activity-panel">
              <activity-feed
                .stateTitles="${Object.fromEntries(
                  this.detail.states.map((s) => [s.id, s.title]),
                )}"
                .taskTitles="${Object.fromEntries(
                  this.detail.tasks.map((t) => [t.id, t.title]),
                )}"
              ></activity-feed>
            </div>
          `
          : ""}
      </div>

      ${this.showTaskModal && maybeState
        ? html`
          <div class="modal-overlay" @click="${() => this.closeTaskModal()}">
            <div class="modal-card" @click="${(e: Event) =>
              e.stopPropagation()}">
              <h2>New task in Maybe?</h2>
              <label for="modal-title">Title</label>
              <input id="modal-title" type="text" placeholder="Task title..."
                .value="${this.modalTitle}"
                @input="${(e: Event) => {
                  this.modalTitle = (e.target as HTMLInputElement).value;
                }}"
                @keydown="${(e: KeyboardEvent) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    this.handleModalCreate(maybeState.id, "close");
                  }
                }}"
              />
              <label for="modal-desc" style="margin-top:var(--space-md);">Description</label>
              <textarea id="modal-desc" placeholder="Description (optional)..."
                .value="${this.modalDescription}"
                @input="${(e: Event) => {
                  this.modalDescription =
                    (e.target as HTMLTextAreaElement).value;
                }}"
                @keydown="${(e: KeyboardEvent) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    this.handleModalCreate(maybeState.id, "close");
                  }
                }}"
              ></textarea>
              ${this.modalError
                ? html`<div class="modal-error">${this.modalError}</div>`
                : ""}
              <div class="modal-btn-row">
                <button class="btn btn-cancel" @click="${() =>
                  this.closeTaskModal()}">Cancel</button>
                <button class="btn btn-primary" @click="${() =>
                  this.handleModalCreate(
                    maybeState.id,
                    "close",
                  )}">Create</button>
                <button class="btn btn-primary" @click="${() =>
                  this.handleModalCreate(
                    maybeState.id,
                    "another",
                  )}">+ another</button>
              </div>
            </div>
          </div>
        `
        : ""}
    `;
  }
}
