import { html, LitElement, css } from 'lit';
import { PageController } from '@open-cells/page-controller';
import { customElement, state } from 'lit/decorators.js';
import { GetBoardUseCase, type BoardDetail } from '../../application/use-cases/boards/get-board.js';
import { CreateTaskUseCase } from '../../application/use-cases/tasks/create-task.js';
import { MoveTaskUseCase } from '../../application/use-cases/tasks/move-task.js';
import { CreateStateUseCase } from '../../application/use-cases/states/create-state.js';
import { UpdateStateUseCase } from '../../application/use-cases/states/update-state.js';
import { DeleteStateUseCase } from '../../application/use-cases/states/delete-state.js';
import { DexieBoardRepository } from '../../infrastructure/repositories/dexie-board.repository.js';
import { DexieStateRepository } from '../../infrastructure/repositories/dexie-state.repository.js';
import { DexieTaskRepository } from '../../infrastructure/repositories/dexie-task.repository.js';
import { inactiveDays } from '../../shared/utils/dates.js';
import type { Task } from '../../domain/entities/task.entity.js';
import type { State } from '../../domain/entities/state.entity.js';
import type { Id } from '../../shared/types/index.js';

const boardRepo = new DexieBoardRepository();
const stateRepo = new DexieStateRepository();
const taskRepo = new DexieTaskRepository();
const getBoard = new GetBoardUseCase(boardRepo, stateRepo, taskRepo);
const createTask = new CreateTaskUseCase(taskRepo);
const moveTask = new MoveTaskUseCase(taskRepo);
const createState = new CreateStateUseCase(stateRepo);
const updateState = new UpdateStateUseCase(stateRepo);
const deleteState = new DeleteStateUseCase(stateRepo, taskRepo);

@customElement('board-detail-page')
export class BoardDetailPage extends LitElement {
  pageController = new PageController(this);
  params: Record<string, string> = {};

  @state() private detail: BoardDetail | null = null;
  @state() private error: string | null = null;

  @state() private expandedColumnId: string | null = null;

  @state() private newTaskTitle = '';
  @state() private newTaskDescription = '';
  @state() private newTaskStateId = '';
  @state() private taskError: string | null = null;

  @state() private dragOverStateId = '';

  @state() private newColumnTitle = '';
  @state() private showColumnForm = false;

  @state() private editingStateId: string | null = null;
  @state() private editingStateTitle = '';

  private boundKeydown: ((e: KeyboardEvent) => void) | null = null;

  static styles = css`
    :host { display: block; }
    .board-header {
      padding: 12px 24px; border-bottom: 2px solid #000;
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    }
    .board-header h1 { margin: 0; flex: 1; font-size: 22px; }
    .board-header .back { cursor: pointer; color: #0066cc; font-size: 18px; }
    .add-column-btn {
      font-size: 13px; color: #0066cc; cursor: pointer; border: 2px dashed #0066cc;
      padding: 4px 12px; border-radius: 4px; background: none; font-weight: bold;
    }
    .add-column-btn:hover { background: #f0f7ff; }
    .column-form { display: flex; gap: 6px; align-items: center; }
    .column-form input {
      padding: 4px 8px; border: 2px solid #000; border-radius: 4px; font-size: 13px;
    }
    .column-form .btn-sm {
      padding: 4px 10px; border: 2px solid #000; border-radius: 4px; cursor: pointer;
      background: #0066cc; color: white; font-size: 13px; font-weight: bold;
    }
    .column-form .cancel {
      background: none; color: #666; border: none; cursor: pointer; font-size: 13px;
    }

    .columns {
      display: flex; gap: 8px; padding: 16px 24px; align-items: stretch;
      height: calc(100vh - 52px); overflow-x: auto; overflow-y: hidden;
    }

    .column-bar {
      width: 52px; min-width: 52px; max-width: 52px; height: 100%;
      background: #f5f5f5; border: 2px solid #000; border-radius: 4px;
      display: flex; flex-direction: column; align-items: center;
      padding: 8px 4px; cursor: pointer; position: relative; overflow: hidden;
      transition: box-shadow 0.15s, transform 0.15s;
    }
    .column-bar:hover { transform: translateY(-2px); box-shadow: 4px 4px 0 #000; }
    .column-bar.active { background: #000; color: #fff; }
    .column-bar .fill {
      position: absolute; bottom: 0; left: 0; right: 0;
      background: #0066cc; border-radius: 0 0 2px 2px;
      transition: height 0.3s ease; z-index: 0;
    }
    .column-bar.active .fill { background: #ffd700; }
    .column-bar .badge {
      width: 28px; height: 28px; background: #fff; border: 2px solid #000;
      border-radius: 4px; display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: bold; z-index: 1; flex-shrink: 0;
    }
    .column-bar.active .badge { background: #ffd700; }
    .column-bar .bar-label {
      writing-mode: vertical-rl; text-orientation: mixed;
      font-size: 11px; font-weight: bold; z-index: 1; margin-top: 8px;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .column-bar .bar-pct {
      font-size: 10px; font-weight: bold; z-index: 1; margin-top: auto;
    }

    .column-expanded {
      width: 288px; min-width: 288px; max-width: 320px; flex-shrink: 0; height: 100%;
      background: #f5f5f5; border: 2px solid #000; border-radius: 4px;
      padding: 12px; display: flex; flex-direction: column; overflow: hidden;
    }
    .column-expanded.drag-over { background: #e0e7ff; }
    .column-header {
      font-weight: bold; margin-bottom: 12px;
      display: flex; justify-content: space-between; align-items: center;
    }
    .column-header .col-title { font-size: 15px; }
    .column-header .col-actions { display: flex; gap: 4px; align-items: center; }
    .column-header .col-actions button {
      background: none; border: none; cursor: pointer; font-size: 14px; padding: 2px 4px;
    }
    .column-header .col-actions button:hover { background: #e0e0e0; border-radius: 3px; }
    .column-count { color: #666; font-weight: normal; font-size: 13px; }
    .collapse-btn {
      cursor: pointer; font-size: 16px; background: none; border: none; padding: 0 4px;
    }
    .collapse-btn:hover { background: #e0e0e0; border-radius: 3px; }

    .state-edit-input {
      font-size: 15px; font-weight: bold; border: 2px solid #000; border-radius: 3px;
      padding: 2px 6px; width: 120px;
    }

    .task-card {
      background: white; border: 2px solid #000; border-radius: 4px;
      padding: 10px; margin-bottom: 8px; cursor: grab;
      transition: box-shadow 0.15s;
    }
    .task-card:active { cursor: grabbing; }
    .task-card:hover { box-shadow: 3px 3px 0 #000; }
    .task-card .title { font-size: 14px; margin-bottom: 4px; font-weight: 500; }
    .task-card .inactive { font-size: 12px; color: #999; }
    .task-card .inactive.stale { color: #cc6600; }
    .image-indicator { font-size: 11px; color: #666; margin-top: 2px; }

    .column-tasks {
      flex: 1; overflow-y: auto; min-height: 0;
    }

    .add-task { flex-shrink: 0; padding-top: 8px; border-top: 1px solid #ddd; }
    .add-task input, .add-task textarea {
      width: 100%; padding: 8px; border: 2px solid #000; border-radius: 4px;
      box-sizing: border-box; font-size: 13px; font-family: inherit;
    }
    .add-task textarea { min-height: 60px; resize: vertical; margin-top: 6px; }
    .add-task .btn-row { display: flex; gap: 6px; margin-top: 6px; }
    .add-task .preview-toggle {
      font-size: 12px; color: #0066cc; cursor: pointer; margin-top: 4px;
      display: inline-block;
    }
    .add-task .preview-box {
      margin-top: 6px; padding: 8px; border: 1px solid #eee; border-radius: 4px;
    }
    .btn {
      padding: 6px 14px; border: 2px solid #000; border-radius: 4px;
      cursor: pointer; font-size: 13px; font-weight: bold;
    }
    .btn-primary { background: #0066cc; color: white; }
    .btn-cancel { background: #fff; color: #000; }
    .btn:hover { opacity: 0.9; }
    .task-error { color: #cc0000; font-size: 12px; margin-top: 4px; }
  `;

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    this.boundKeydown = this.handleKeydown.bind(this);
    document.addEventListener('keydown', this.boundKeydown);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.boundKeydown) {
      document.removeEventListener('keydown', this.boundKeydown);
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
      this.error = e instanceof Error ? e.message : 'Failed to load board';
    }
  }

  private getMandatoryOrder(): { first: Id<'State'>; maybe: Id<'State'>; last: Id<'State'> } {
    if (!this.detail) return { first: '' as Id<'State'>, maybe: '' as Id<'State'>, last: '' as Id<'State'> };
    const sorted = [...this.detail.states].sort((a, b) => a.order - b.order);
    return {
      first: sorted[0]?.id ?? ('' as Id<'State'>),
      maybe: sorted[1]?.id ?? ('' as Id<'State'>),
      last: sorted[sorted.length - 1]?.id ?? ('' as Id<'State'>),
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
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    const sorted = this.getSortedStates();
    const maybeIdx = sorted.findIndex(s => s.id === this.getMandatoryOrder().maybe);

    if (e.key === 'Escape') {
      this.expandedColumnId = null;
      return;
    }

    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const currentIdx = this.expandedColumnId
        ? sorted.findIndex(s => s.id === this.expandedColumnId)
        : maybeIdx;

      let nextIdx: number;
      if (e.key === 'ArrowLeft') {
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

  private async handleCreateTask(stateId: string): Promise<void> {
    if (!this.newTaskTitle.trim() || !this.detail) return;
    try {
      this.taskError = null;
      await createTask.execute({
        boardId: this.detail.board.id,
        stateId,
        title: this.newTaskTitle.trim(),
        description: this.newTaskDescription.trim() || undefined,
      });
      this.newTaskTitle = '';
      this.newTaskDescription = '';
      this.newTaskStateId = '';
      await this.loadBoard();
    } catch (e) {
      this.taskError = e instanceof Error ? e.message : 'Failed to create task';
    }
  }

  private handleDragStart(e: DragEvent, task: Task): void {
    e.dataTransfer?.setData('text/plain', task.id);
    e.dataTransfer?.setData('application/x-kanbank-from-state', task.stateId);
  }

  private handleDragOver(e: DragEvent, stateId: string): void {
    e.preventDefault();
    this.dragOverStateId = stateId;
  }

  private handleDragLeave(): void {
    this.dragOverStateId = '';
  }

  private async handleDrop(e: DragEvent, stateId: string): Promise<void> {
    e.preventDefault();
    this.dragOverStateId = '';
    const taskId = e.dataTransfer?.getData('text/plain');
    if (!taskId || !this.detail) return;

    const tasksInColumn = this.detail.tasks.filter(t => t.stateId === stateId);
    await moveTask.execute({ taskId, newStateId: stateId, order: tasksInColumn.length });
    await this.loadBoard();
  }

  private selectTask(task: Task): void {
    this.pageController.navigate('task-detail', { id: task.id });
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
        order,
      });
      this.newColumnTitle = '';
      this.showColumnForm = false;
      await this.loadBoard();
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to create state';
    }
  }

  private startEditState(state: State): void {
    this.editingStateId = state.id;
    this.editingStateTitle = state.title;
  }

  private async saveEditState(state: State): Promise<void> {
    if (!this.editingStateTitle.trim()) return;
    try {
      await updateState.execute(state.id, { title: this.editingStateTitle.trim() });
      this.editingStateId = null;
      this.editingStateTitle = '';
      await this.loadBoard();
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to update state';
    }
  }

  private cancelEditState(): void {
    this.editingStateId = null;
    this.editingStateTitle = '';
  }

  private async handleDeleteState(state: State): Promise<void> {
    if (!confirm(`Delete "${state.title}"? Tasks will be moved to Maybe?`)) return;
    try {
      await deleteState.execute(state.id);
      await this.loadBoard();
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to delete state';
    }
  }

  private toggleColumn(stateId: string): void {
    this.expandedColumnId = this.expandedColumnId === stateId ? null : stateId;
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
        class="column-bar ${isActive ? 'active' : ''} ${this.dragOverStateId === state.id ? 'drag-over' : ''}"
        @click="${() => this.toggleColumn(state.id)}"
        @dragover="${(e: DragEvent) => this.handleDragOver(e, state.id)}"
        @dragleave="${() => this.handleDragLeave()}"
        @drop="${(e: DragEvent) => this.handleDrop(e, state.id)}"
      >
        <div class="fill" style="height: ${isNotNow ? '100' : pct}%; ${isNotNow ? 'background:#cc6600' : ''}"></div>
        <div class="badge">${count}</div>
        <div class="bar-label">${state.title}</div>
        ${!isNotNow ? html`<div class="bar-pct">${pct}%</div>` : ''}
      </div>
    `;
  }

  private renderExpanded(state: State): unknown {
    if (!this.detail) return html``;
    const { tasks } = this.detail;
    const stateTasks = tasks
      .filter(t => t.stateId === state.id)
      .sort((a, b) => new Date(a.lastActivityAt).getTime() - new Date(b.lastActivityAt).getTime());
    const mandatory = this.getMandatoryOrder();
    const isMandatory = state.id === mandatory.first || state.id === mandatory.maybe || state.id === mandatory.last;

    return html`
      <div
        class="column-expanded ${this.dragOverStateId === state.id ? 'drag-over' : ''}"
        @dragover="${(e: DragEvent) => this.handleDragOver(e, state.id)}"
        @dragleave="${() => this.handleDragLeave()}"
        @drop="${(e: DragEvent) => this.handleDrop(e, state.id)}"
      >
        <div class="column-header">
          ${this.editingStateId === state.id ? html`
            <input
              class="state-edit-input"
              type="text"
              .value="${this.editingStateTitle}"
              @input="${(e: Event) => { this.editingStateTitle = (e.target as HTMLInputElement).value; }}"
              @keydown="${(e: KeyboardEvent) => {
                if (e.key === 'Enter') this.saveEditState(state);
                if (e.key === 'Escape') this.cancelEditState();
              }}"
            />
          ` : html`
            <span class="col-title">${state.title}</span>
          `}
          <div class="col-actions">
            <span class="column-count">${this.detail.taskCounts[state.id] ?? 0}</span>
            ${!isMandatory ? html`
              <button @click="${() => this.startEditState(state)}" title="Edit">&#9998;</button>
              <button @click="${() => this.handleDeleteState(state)}" title="Delete">&#10005;</button>
              <button class="collapse-btn" @click="${() => this.expandedColumnId = null}" title="Collapse">&#9664;</button>
            ` : html`
              <button class="collapse-btn" @click="${() => this.expandedColumnId = null}" title="Collapse">&#9664;</button>
            `}
          </div>
        </div>

        <div class="column-tasks">
          ${stateTasks.map(task => {
            const days = inactiveDays(task.lastActivityAt);
            return html`
              <div
                class="task-card"
                draggable="true"
                @dragstart="${(e: DragEvent) => this.handleDragStart(e, task)}"
                @click="${() => this.selectTask(task)}"
              >
                <div class="title">${task.title}</div>
                ${task.images.length ? html`<div class="image-indicator">&#128444; ${task.images.length}</div>` : ''}
                ${days > 0 ? html`<div class="inactive ${days > 7 ? 'stale' : ''}">${days}d inactive</div>` : ''}
              </div>
            `;
          })}
        </div>

        <div class="add-task">
          <input
            type="text"
            placeholder="Task title..."
            .value="${this.newTaskStateId === state.id ? this.newTaskTitle : ''}"
            @focus="${() => { this.newTaskStateId = state.id; }}"
            @input="${(e: Event) => { this.newTaskTitle = (e.target as HTMLInputElement).value; }}"
            @keydown="${(e: KeyboardEvent) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.handleCreateTask(state.id); }
            }}"
          />
          ${this.newTaskStateId === state.id ? html`
            <textarea
              placeholder="Description (markdown)..."
              .value="${this.newTaskDescription}"
              @input="${(e: Event) => { this.newTaskDescription = (e.target as HTMLTextAreaElement).value; }}"
              @keydown="${(e: KeyboardEvent) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); this.handleCreateTask(state.id); }
              }}"
            ></textarea>
            ${this.newTaskDescription.trim() ? html`
              <span class="preview-toggle" @click="${() => {
                const el = this.renderRoot.querySelector(`[data-preview="${state.id}"]`) as HTMLElement;
                if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
              }}">Preview</span>
              <div class="preview-box" data-preview="${state.id}" style="display:none;">
                <markdown-viewer .content="${this.newTaskDescription}"></markdown-viewer>
              </div>
            ` : ''}
            <div class="btn-row">
              <button class="btn btn-primary" @click="${() => this.handleCreateTask(state.id)}">Add</button>
            </div>
            ${this.taskError && this.newTaskStateId === state.id ? html`<div class="task-error">${this.taskError}</div>` : ''}
          ` : ''}
        </div>
      </div>
    `;
  }

  render() {
    if (this.error) return html`<div style="padding:24px;color:#cc0000;">Error: ${this.error}</div>`;
    if (!this.detail) return html`<div>Loading...</div>`;

    const { board } = this.detail;
    const sorted = this.getSortedStates();
    const mandatory = this.getMandatoryOrder();
    const maybeState = sorted.find(s => s.id === mandatory.maybe);
    const leftStates = sorted.filter(s => s.order < (maybeState?.order ?? 1));
    const rightStates = sorted.filter(s => s.order > (maybeState?.order ?? 1));

    return html`
      <div class="board-header">
        <span class="back" @click="${() => this.pageController.navigate('home')}">&#8592;</span>
        <h1>${board.title}</h1>
        ${this.showColumnForm ? html`
          <div class="column-form">
            <input
              type="text"
              placeholder="Column name..."
              .value="${this.newColumnTitle}"
              @input="${(e: Event) => { this.newColumnTitle = (e.target as HTMLInputElement).value; }}"
              @keydown="${(e: KeyboardEvent) => {
                if (e.key === 'Enter') this.handleCreateState();
                if (e.key === 'Escape') { this.showColumnForm = false; this.newColumnTitle = ''; }
              }}"
            />
            <button class="btn-sm" @click="${this.handleCreateState}">Add</button>
            <button class="cancel" @click="${() => { this.showColumnForm = false; this.newColumnTitle = ''; }}">Cancel</button>
          </div>
        ` : html`
          <button class="add-column-btn" @click="${() => { this.showColumnForm = true; }}">+ Add column</button>
        `}
      </div>

      <div class="columns">
        ${leftStates.map(s => s.id === mandatory.first ? this.renderBar(s) : this.expandedColumnId === s.id ? this.renderExpanded(s) : this.renderBar(s))}
        ${maybeState ? this.renderExpanded(maybeState) : ''}
        ${rightStates.map(s => s.id === mandatory.last ? this.renderBar(s) : this.expandedColumnId === s.id ? this.renderExpanded(s) : this.renderBar(s))}
      </div>
    `;
  }
}
