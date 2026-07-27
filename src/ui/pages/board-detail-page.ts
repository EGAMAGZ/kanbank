import { css, html, LitElement } from "lit";
import { PageController } from "@open-cells/page-controller";
import { customElement, state } from "lit/decorators.js";
import {
  type BoardDetail,
  GetBoardUseCase,
} from "../../application/use-cases/boards/get-board.js";
import { CreateTaskUseCase } from "../../application/use-cases/tasks/create-task.js";
import { MoveTaskUseCase } from "../../application/use-cases/tasks/move-task.js";
import { CreateStateUseCase } from "../../application/use-cases/states/create-state.js";
import { UpdateStateUseCase } from "../../application/use-cases/states/update-state.js";
import { DeleteStateUseCase } from "../../application/use-cases/states/delete-state.js";
import { DexieBoardRepository } from "../../infrastructure/repositories/dexie-board.repository.js";
import { DexieStateRepository } from "../../infrastructure/repositories/dexie-state.repository.js";
import { DexieTaskRepository } from "../../infrastructure/repositories/dexie-task.repository.js";
import { inactiveDays } from "../../shared/utils/dates.js";
import type { Task } from "../../domain/entities/task.entity.js";
import type { State } from "../../domain/entities/state.entity.js";
import type { Id } from "../../shared/types/index.js";

const boardRepo = new DexieBoardRepository();
const stateRepo = new DexieStateRepository();
const taskRepo = new DexieTaskRepository();
const getBoard = new GetBoardUseCase(boardRepo, stateRepo, taskRepo);
const createTask = new CreateTaskUseCase(taskRepo);
const moveTask = new MoveTaskUseCase(taskRepo);
const createState = new CreateStateUseCase(stateRepo);
const updateState = new UpdateStateUseCase(stateRepo);
const deleteState = new DeleteStateUseCase(stateRepo, taskRepo);

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
  private newColumnTitle = "";
  @state()
  private newColumnColor = "#2563EB";
  @state()
  private showColumnForm = false;

  @state()
  private editingStateId: string | null = null;
  @state()
  private editingStateTitle = "";
  @state()
  private editingStateColor = "#2563EB";

  @state()
  private showTaskModal = false;
  @state()
  private modalTitle = "";
  @state()
  private modalDescription = "";
  @state()
  private modalError: string | null = null;

  private boundKeydown: ((e: KeyboardEvent) => void) | null = null;

  static styles = css`
    :host {
      display: block;
    }

    .board-header {
      padding: var(--space-2xl) var(--gutter-lg) var(--space-xl);
      display: flex;
      align-items: baseline;
      gap: var(--space-lg);
      flex-wrap: wrap;
    }

    .board-header h1 {
      margin: 0;
      flex: 1;
      font-family: var(--font-display);
      font-weight: 800;
      font-size: var(--text-4xl);
      letter-spacing: -0.04em;
      line-height: var(--leading-tight);
    }

    .board-header .back {
      cursor: pointer;
      color: var(--color-text-2);
      font-size: 20px;
      transition: color var(--ease-brutal);
      align-self: center;
    }

    .board-header .back:hover {
      color: var(--color-text);
    }

    .add-column-btn {
      font-size: var(--text-sm);
      color: var(--color-accent);
      cursor: pointer;
      border: 2px dashed var(--color-accent);
      padding: var(--space-xs) var(--space-md);
      background: none;
      font-weight: 700;
      font-family: var(--font-body);
      transition: background var(--ease-brutal);
    }

    .add-column-btn:hover {
      background: rgba(37, 99, 235, 0.06);
    }

    .column-form {
      display: flex;
      gap: var(--space-sm);
      align-items: center;
    }

    .column-form input[type="text"] {
      padding: var(--space-xs) var(--space-sm);
      border: 2px solid var(--color-black);
      font-size: var(--text-sm);
      font-family: var(--font-body);
      outline: none;
      transition: box-shadow var(--ease-brutal);
    }

    .column-form input[type="text"]:focus {
      box-shadow: 2px 2px 0 var(--color-accent);
    }

    .column-form input[type="color"] {
      width: 32px;
      height: 32px;
      border: 2px solid var(--color-black);
      cursor: pointer;
      padding: 2px;
    }

    .column-form .btn-sm {
      padding: var(--space-xs) var(--space-sm);
      border: 2px solid var(--color-black);
      box-shadow: 3px 3px 0 var(--color-black);
      cursor: pointer;
      background: var(--color-text);
      color: var(--color-white);
      font-size: var(--text-sm);
      font-weight: 700;
      font-family: var(--font-body);
      transition: transform var(--ease-brutal), box-shadow var(--ease-brutal);
    }

    .column-form .btn-sm:hover {
      transform: translate(1px, 1px);
      box-shadow: 2px 2px 0 var(--color-black);
    }

    .column-form .cancel {
      background: none;
      color: var(--color-text-2);
      border: none;
      cursor: pointer;
      font-size: var(--text-sm);
      font-family: var(--font-body);
    }

    /* Columns area — generous horizontal padding */
    .columns {
      display: flex;
      gap: var(--space-lg);
      padding: 0 var(--gutter-lg) var(--space-2xl);
      align-items: stretch;
      min-height: calc(100vh - 160px);
      overflow-x: auto;
      overflow-y: auto;
    }

    /* Column bar — brutal border + shadow (interactive, justified) */
    .column-bar {
      width: 56px;
      min-width: 56px;
      max-width: 56px;
      height: calc(100vh - 200px);
      background: var(--color-white);
      border: 2px solid var(--color-black);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--space-sm) var(--space-xs);
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: box-shadow var(--ease-brutal), transform var(--ease-brutal);
    }

    .column-bar:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-brutal);
    }

    .column-bar:active {
      transform: translateY(2px);
      box-shadow: 0 0 0 var(--color-black);
    }

    .column-bar.active {
      background: var(--color-text);
      color: var(--color-white);
    }

    .column-bar .fill {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      transition: height 0.3s ease;
      z-index: 0;
    }

    .column-bar.active .fill {
      background: var(--color-accent) !important;
    }

    .column-bar .badge {
      width: 32px;
      height: 32px;
      background: var(--color-white);
      border: 2px solid var(--color-black);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-sm);
      font-weight: 700;
      z-index: 1;
      flex-shrink: 0;
    }

    .column-bar.active .badge {
      background: var(--color-accent);
      color: var(--color-white);
    }

    .column-bar .bar-label {
      writing-mode: vertical-rl;
      text-orientation: mixed;
      font-size: 11px;
      font-weight: 700;
      z-index: 1;
      margin-top: var(--space-sm);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .column-bar .bar-pct {
      font-size: 10px;
      font-weight: 700;
      z-index: 1;
      margin-top: auto;
    }

    /* Expanded column — the anchor panel */
    .column-expanded {
      width: 320px;
      min-width: 320px;
      max-width: 360px;
      flex-shrink: 0;
      background: var(--color-white);
      border: 2px solid var(--color-black);
      box-shadow: var(--shadow-brutal-md);
      padding: var(--space-lg);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .column-expanded.drag-over {
      background: rgba(37, 99, 235, 0.04);
      box-shadow: var(--shadow-brutal-md), inset 0 0 0 2px var(--color-accent);
    }

    .column-header {
      font-weight: 700;
      margin-bottom: var(--space-lg);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .column-header .col-title {
      font-family: var(--font-display);
      font-size: var(--text-lg);
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .column-header .col-actions {
      display: flex;
      gap: var(--space-xs);
      align-items: center;
    }

    .column-header .col-actions button {
      background: none;
      border: none;
      cursor: pointer;
      font-size: var(--text-base);
      padding: 2px var(--space-xs);
      color: var(--color-text-2);
      transition: color var(--ease-brutal);
    }

    .column-header .col-actions button:hover {
      color: var(--color-text);
    }

    .column-count {
      color: var(--color-text-2);
      font-weight: 500;
      font-size: var(--text-sm);
    }

    .collapse-btn {
      cursor: pointer;
      font-size: var(--text-lg);
      background: none;
      border: none;
      padding: 0 var(--space-xs);
      color: var(--color-text-2);
      transition: color var(--ease-brutal);
    }

    .collapse-btn:hover {
      color: var(--color-text);
    }

    .state-edit-input {
      font-size: var(--text-base);
      font-weight: 700;
      border: 2px solid var(--color-black);
      padding: var(--space-xs) var(--space-sm);
      width: 140px;
      font-family: var(--font-body);
      outline: none;
      transition: box-shadow var(--ease-brutal);
    }

    .state-edit-input:focus {
      box-shadow: 2px 2px 0 var(--color-accent);
    }

    .state-edit-color {
      width: 28px;
      height: 28px;
      border: 2px solid var(--color-black);
      cursor: pointer;
      padding: 2px;
      margin-left: var(--space-xs);
    }

    /* Task items — pure typography, spacing does the work */
    .task-item {
      padding: var(--space-md) 0;
      cursor: grab;
      transition: background var(--ease-brutal);
    }

    .task-item + .task-item {
      border-top: 1px solid var(--color-border);
    }

    .task-item:hover {
      background: var(--color-surface);
      margin: 0 calc(var(--space-md) * -1);
      padding-left: var(--space-md);
      padding-right: var(--space-md);
    }

    .task-item:active {
      cursor: grabbing;
    }

    .task-item .title {
      font-size: var(--text-base);
      margin-bottom: 2px;
      font-weight: 500;
      line-height: var(--leading-snug);
    }

    .task-item .inactive {
      font-size: var(--text-xs);
      color: var(--color-text-3);
    }

    .task-item .inactive.stale {
      color: var(--color-warning);
    }

    .image-indicator {
      font-size: 11px;
      color: var(--color-text-2);
      margin-top: var(--space-xs);
    }

    .column-tasks {
      flex: 1;
      overflow-y: auto;
      min-height: 0;
    }

    .btn {
      padding: var(--space-sm) var(--space-md);
      border: 2px solid var(--color-black);
      cursor: pointer;
      font-size: var(--text-sm);
      font-weight: 700;
      font-family: var(--font-body);
      transition: transform var(--ease-brutal), box-shadow var(--ease-brutal);
    }

    .btn-primary {
      box-shadow: 3px 3px 0 var(--color-black);
      background: var(--color-accent);
      color: var(--color-white);
    }

    .btn-primary:hover {
      transform: translate(1px, 1px);
      box-shadow: 2px 2px 0 var(--color-black);
    }

    .btn-primary:active {
      transform: translate(3px, 3px);
      box-shadow: 0 0 0 var(--color-black);
    }

    .btn-cancel {
      box-shadow: none;
      background: var(--color-white);
      color: var(--color-text);
    }

    .btn-cancel:hover {
      background: var(--color-surface);
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
    }

    .modal-card {
      background: var(--color-white);
      border: 2px solid var(--color-black);
      box-shadow: var(--shadow-brutal-lg);
      padding: var(--space-xl);
      width: 500px;
      max-height: 80vh;
      overflow-y: auto;
    }

    .modal-card h2 {
      margin: 0 0 var(--space-lg);
      font-family: var(--font-display);
      font-size: var(--text-xl);
      font-weight: 800;
      letter-spacing: -0.03em;
    }

    .modal-card label {
      display: block;
      font-size: var(--text-sm);
      font-weight: 700;
      margin-bottom: var(--space-xs);
      color: var(--color-text);
    }

    .modal-card input,
    .modal-card textarea {
      width: 100%;
      padding: var(--space-sm) var(--space-md);
      border: 2px solid var(--color-black);
      box-sizing: border-box;
      font-size: var(--text-sm);
      font-family: var(--font-body);
      outline: none;
      background: var(--color-white);
      transition: box-shadow var(--ease-brutal);
    }

    .modal-card input:focus,
    .modal-card textarea:focus {
      box-shadow: 2px 2px 0 var(--color-accent);
    }

    .modal-card textarea {
      min-height: 120px;
      resize: vertical;
      margin-top: var(--space-xs);
    }

    .modal-card .preview-toggle {
      font-size: var(--text-xs);
      color: var(--color-accent);
      cursor: pointer;
      margin-top: var(--space-sm);
      display: inline-block;
    }

    .modal-card .preview-toggle:hover {
      text-decoration: underline;
    }

    .modal-card .preview-box {
      margin-top: var(--space-sm);
      padding: var(--space-md);
      border: 1px solid var(--color-border);
    }

    .modal-card .modal-btn-row {
      display: flex;
      gap: var(--space-sm);
      margin-top: var(--space-lg);
      justify-content: flex-end;
    }

    .modal-card .modal-error {
      color: var(--color-error);
      font-size: var(--text-sm);
      margin-top: var(--space-md);
    }

    .add-task-btn {
      display: block;
      width: 100%;
      padding: var(--space-md);
      margin-bottom: var(--space-sm);
      flex-shrink: 0;
      border: 2px dashed var(--color-accent);
      background: none;
      color: var(--color-accent);
      font-size: var(--text-sm);
      font-weight: 700;
      font-family: var(--font-body);
      cursor: pointer;
      transition: background var(--ease-brutal);
    }

    .add-task-btn:hover {
      background: rgba(37, 99, 235, 0.06);
    }
  `;

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    this.boundKeydown = this.handleKeydown.bind(this);
    document.addEventListener("keydown", this.boundKeydown);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.boundKeydown) {
      document.removeEventListener("keydown", this.boundKeydown);
      this.boundKeydown = null;
    }
  }

  async onPageEnter(): Promise<void> {
    await this.loadBoard();
  }

  private async loadBoard(): Promise<void> {
    const id = this.params?.id;
    if (!id) return;
    try {
      this.error = null;
      this.detail = await getBoard.execute(id as any);
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to load board";
    }
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

  private handleKeydown(e: KeyboardEvent): void {
    if (!this.detail) return;
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) return;

    const sorted = this.getSortedStates();
    const maybeIdx = sorted.findIndex((s) =>
      s.id === this.getMandatoryOrder().maybe
    );

    if (e.key === "Escape") {
      if (this.showTaskModal) {
        this.closeTaskModal();
      } else {
        this.expandedColumnId = null;
      }
      return;
    }

    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const currentIdx = this.expandedColumnId
        ? sorted.findIndex((s) => s.id === this.expandedColumnId)
        : maybeIdx;

      let nextIdx: number;
      if (e.key === "ArrowLeft") {
        nextIdx = currentIdx - 1;
        if (nextIdx < 0) nextIdx = 0;
      } else {
        nextIdx = currentIdx + 1;
        if (nextIdx >= sorted.length) nextIdx = sorted.length - 1;
      }

      const nextState = sorted[nextIdx];
      if (nextState && nextState.id !== this.getMandatoryOrder().maybe) {
        this.expandedColumnId = nextState.id;
      }
    }
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

    const tasksInColumn = this.detail.tasks.filter((t) =>
      t.stateId === stateId
    );
    await moveTask.execute({
      taskId,
      newStateId: stateId,
      order: tasksInColumn.length,
    });
    await this.loadBoard();
  }

  private selectTask(task: Task): void {
    this.pageController.navigate("task-detail", { id: task.id });
  }

  private async handleCreateState(): Promise<void> {
    if (!this.newColumnTitle.trim() || !this.detail) return;
    try {
      const sorted = this.getSortedStates();
      const doneState = sorted[sorted.length - 1];
      const order = doneState ? sorted.length - 1 : sorted.length;
      await createState.execute({
        boardId: this.detail.board.id,
        title: this.newColumnTitle.trim(),
        color: this.newColumnColor,
        order,
      });
      this.newColumnTitle = "";
      this.newColumnColor = "#2563EB";
      this.showColumnForm = false;
      await this.loadBoard();
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to create state";
    }
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
      this.editingStateTitle = "";
      this.editingStateColor = "#2563EB";
      await this.loadBoard();
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to update state";
    }
  }

  private cancelEditState(): void {
    this.editingStateId = null;
    this.editingStateTitle = "";
    this.editingStateColor = "#2563EB";
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

  private toggleColumn(stateId: string): void {
    this.expandedColumnId = this.expandedColumnId === stateId ? null : stateId;
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

  private renderBar(state: State): unknown {
    if (!this.detail) return html``;
    const count = this.detail.taskCounts[state.id] ?? 0;
    const max = this.getMaxTaskCount();
    const pct = Math.round((count / max) * 100);
    const isActive = this.expandedColumnId === state.id;
    const mandatory = this.getMandatoryOrder();
    const isNotNow = state.id === mandatory.first;

    return html`
      <div
        class="column-bar ${isActive
          ? "active"
          : ""} ${this.dragOverStateId === state.id ? "drag-over" : ""}"
        @click="${() => this.toggleColumn(state.id)}"
        @dragover="${(e: DragEvent) => this.handleDragOver(e, state.id)}"
        @dragleave="${() => this.handleDragLeave()}"
        @drop="${(e: DragEvent) => this.handleDrop(e, state.id)}"
      >
        <div class="fill" style="height: ${isNotNow ? "100" : pct}%; ${isNotNow
          ? "background:var(--color-warning)"
          : `background:${state.color}`}"></div>
        <div class="badge">${count}</div>
        <div class="bar-label">${state.title}</div>
        ${!isNotNow ? html`<div class="bar-pct">${pct}%</div>` : ""}
      </div>
    `;
  }

  private renderExpanded(state: State): unknown {
    if (!this.detail) return html``;
    const { tasks } = this.detail;
    const stateTasks = tasks
      .filter((t) => t.stateId === state.id)
      .sort((a, b) =>
        new Date(a.lastActivityAt).getTime() -
        new Date(b.lastActivityAt).getTime()
      );
    const mandatory = this.getMandatoryOrder();
    const isMandatory = state.id === mandatory.first ||
      state.id === mandatory.maybe || state.id === mandatory.last;

    return html`
      <div
        class="column-expanded ${this.dragOverStateId === state.id
          ? "drag-over"
          : ""}"
        style="border-top: 3px solid ${state.color};"
        @dragover="${(e: DragEvent) => this.handleDragOver(e, state.id)}"
        @dragleave="${() => this.handleDragLeave()}"
        @drop="${(e: DragEvent) => this.handleDrop(e, state.id)}"
      >
        <div class="column-header">
          ${this.editingStateId === state.id
            ? html`
              <div style="display:flex;align-items:center;gap:var(--space-xs);">
                <input
                  class="state-edit-input"
                  type="text"
                  .value="${this.editingStateTitle}"
                  @input="${(e: Event) => {
                    this.editingStateTitle =
                      (e.target as HTMLInputElement).value;
                  }}"
                  @keydown="${(e: KeyboardEvent) => {
                    if (e.key === "Enter") this.saveEditState(state);
                    if (e.key === "Escape") this.cancelEditState();
                  }}"
                />
                <input
                  class="state-edit-color"
                  type="color"
                  .value="${this.editingStateColor}"
                  @input="${(e: Event) => {
                    this.editingStateColor =
                      (e.target as HTMLInputElement).value;
                  }}"
                />
              </div>
            `
            : html`
              <span class="col-title">${state.title}</span>
            `}
          <div class="col-actions">
            <span class="column-count">${this.detail.taskCounts[state.id] ??
              0}</span>
            ${!isMandatory
              ? html`
                <button @click="${() =>
                  this.startEditState(state)}" title="Edit">&#9998;</button>
                <button @click="${() =>
                  this.handleDeleteState(
                    state,
                  )}" title="Delete">&#10005;</button>
                <button class="collapse-btn" @click="${() =>
                  this.expandedColumnId = null}"
                  title="Collapse">&#9664;</button>
              `
              : html`
                <button class="collapse-btn" @click="${() =>
                  this.expandedColumnId = null}"
                  title="Collapse">&#9664;</button>
              `}
          </div>
        </div>

        ${state.id === mandatory.maybe
          ? html`
            <button class="add-task-btn" @click="${() =>
              this.openTaskModal()}">+ Add task</button>
          `
          : ""}

        <div class="column-tasks">
          ${stateTasks.map((task) => {
            const days = inactiveDays(task.lastActivityAt);
            return html`
              <div
                class="task-item"
                draggable="true"
                @dragstart="${(e: DragEvent) => this.handleDragStart(e, task)}"
                @click="${() => this.selectTask(task)}"
              >
                <div class="title">${task.title}</div>
                ${task.images.length
                  ? html`<div class="image-indicator">&#128444; ${task.images.length}</div>`
                  : ""}
                ${days > 0
                  ? html`<div class="inactive ${
                    days > 7 ? "stale" : ""
                  }">${days}d inactive</div>`
                  : ""}
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  render() {
    if (this.error) {
      return html`
        <div
          style="padding:var(--space-xl);color:var(--color-error);">Error: ${this
            .error}</div>
      `;
    }
    if (!this.detail) {
      return html`<div style="padding:var(--space-xl);color:var(--color-text-3);">Loading...</div>`;
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
          this.pageController.navigate("home")}">&#8592;</span>
        <h1>${board.title}</h1>
        ${this.showColumnForm
          ? html`
            <div class="column-form">
              <input
                type="text"
                placeholder="Column name..."
                .value="${this.newColumnTitle}"
                @input="${(e: Event) => {
                  this.newColumnTitle = (e.target as HTMLInputElement).value;
                }}"
                @keydown="${(e: KeyboardEvent) => {
                  if (e.key === "Enter") this.handleCreateState();
                  if (e.key === "Escape") {
                    this.showColumnForm = false;
                    this.newColumnTitle = "";
                  }
                }}"
              />
              <input
                type="color"
                .value="${this.newColumnColor}"
                @input="${(e: Event) => {
                  this.newColumnColor = (e.target as HTMLInputElement).value;
                }}"
              />
              <button class="btn-sm" @click="${this
                .handleCreateState}">Add</button>
              <button class="cancel" @click="${() => {
                this.showColumnForm = false;
                this.newColumnTitle = "";
              }}">Cancel</button>
            </div>
          `
          : html`
            <button class="add-column-btn" @click="${() => {
              this.showColumnForm = true;
            }}">+ Add column</button>
          `}
      </div>

      <div class="columns">
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

      ${this.showTaskModal && maybeState
        ? html`
          <div class="modal-overlay" @click="${() => this.closeTaskModal()}">
            <div class="modal-card" @click="${(e: Event) =>
              e.stopPropagation()}">
              <h2>New task in Maybe?</h2>
              <label for="modal-title">Title</label>
              <input
                id="modal-title"
                type="text"
                placeholder="Task title..."
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
              <label for="modal-desc" style="margin-top:var(--space-md);">Description (markdown)</label>
              <textarea
                id="modal-desc"
                placeholder="Description (optional)..."
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
              ${this.modalDescription.trim()
                ? html`
                  <span class="preview-toggle" @click="${() => {
                    const el = this.renderRoot.querySelector(
                      "[data-modal-preview]",
                    ) as HTMLElement;
                    if (el) {el.style.display = el.style.display === "none"
                        ? "block"
                        : "none";}
                  }}">Preview</span>
                  <div class="preview-box" data-modal-preview style="display:none;">
                    <markdown-viewer .content="${this
                      .modalDescription}"></markdown-viewer>
                  </div>
                `
                : ""}
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
                  )}">Create another one</button>
                <button class="btn btn-primary" @click="${() =>
                  this.handleModalCreate(
                    maybeState.id,
                    "duplicate",
                  )}">Create and duplicate</button>
              </div>
            </div>
          </div>
        `
        : ""}
    `;
  }
}
