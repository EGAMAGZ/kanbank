import { html, LitElement, css } from 'lit';
import { PageController } from '@open-cells/page-controller';
import { customElement, state } from 'lit/decorators.js';
import { GetBoardUseCase, type BoardDetail } from '../../application/use-cases/boards/get-board.js';
import { CreateTaskUseCase } from '../../application/use-cases/tasks/create-task.js';
import { MoveTaskUseCase } from '../../application/use-cases/tasks/move-task.js';
import { AttachImageUseCase } from '../../application/use-cases/tasks/attach-image.js';
import { DetachImageUseCase } from '../../application/use-cases/tasks/detach-image.js';
import { AddCommentUseCase } from '../../application/use-cases/comments/add-comment.js';
import { AttachImageCommentUseCase } from '../../application/use-cases/comments/attach-image-comment.js';
import { DetachImageCommentUseCase } from '../../application/use-cases/comments/detach-image-comment.js';
import { CreateStateUseCase } from '../../application/use-cases/states/create-state.js';
import { ReorderStatesUseCase } from '../../application/use-cases/states/reorder-states.js';
import { DexieBoardRepository } from '../../infrastructure/repositories/dexie-board.repository.js';
import { DexieStateRepository } from '../../infrastructure/repositories/dexie-state.repository.js';
import { DexieTaskRepository } from '../../infrastructure/repositories/dexie-task.repository.js';
import { DexieCommentRepository } from '../../infrastructure/repositories/dexie-comment.repository.js';
import { DexieImageRepository } from '../../infrastructure/storage/image-storage.service.js';
import { inactiveDays } from '../../shared/utils/dates.js';
import type { Task } from '../../domain/entities/task.entity.js';
import type { Comment } from '../../domain/entities/comment.entity.js';
import type { State } from '../../domain/entities/state.entity.js';
import type { Id } from '../../shared/types/index.js';
import '../../ui/components/markdown-viewer.js';
import '../../ui/components/image-gallery.js';
import '../../ui/components/image-upload.js';

const boardRepo = new DexieBoardRepository();
const stateRepo = new DexieStateRepository();
const taskRepo = new DexieTaskRepository();
const commentRepo = new DexieCommentRepository();
const imageRepo = new DexieImageRepository();
const getBoard = new GetBoardUseCase(boardRepo, stateRepo, taskRepo);
const createTask = new CreateTaskUseCase(taskRepo);
const moveTask = new MoveTaskUseCase(taskRepo);
const attachImage = new AttachImageUseCase(taskRepo, imageRepo);
const detachImage = new DetachImageUseCase(taskRepo, imageRepo);
const addComment = new AddCommentUseCase(commentRepo, taskRepo);
const attachCommentImage = new AttachImageCommentUseCase(commentRepo, taskRepo, imageRepo);
const detachCommentImage = new DetachImageCommentUseCase(commentRepo, taskRepo, imageRepo);
const createState = new CreateStateUseCase(stateRepo);
const reorderStates = new ReorderStatesUseCase(stateRepo);

@customElement('board-detail-page')
export class BoardDetailPage extends LitElement {
  pageController = new PageController(this);
  params: Record<string, string> = {};

  @state() private detail: BoardDetail | null = null;
  @state() private error: string | null = null;
  @state() private selectedTask: Task | null = null;
  @state() private comments: Comment[] = [];
  @state() private commentError: string | null = null;
  @state() private newTaskTitle = '';
  @state() private newTaskDescription = '';
  @state() private newTaskStateId = '';
  @state() private newComment = '';
  @state() private dragOverStateId = '';
  @state() private newColumnTitle = '';
  @state() private showColumnForm = false;

  static styles = css`
    :host { display: block; }
    .board-header {
      padding: 16px 24px; border-bottom: 1px solid #ddd;
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    }
    .board-header h1 { margin: 0; flex: 1; }
    .board-header .back { cursor: pointer; color: #0066cc; margin-right: 8px; }
    .board-header .desc { font-size: 14px; color: #666; width: 100%; }
    .add-column-btn {
      font-size: 13px; color: #0066cc; cursor: pointer; border: 1px dashed #0066cc;
      padding: 4px 12px; border-radius: 4px; background: none; white-space: nowrap;
    }
    .add-column-btn:hover { background: #f0f7ff; }
    .column-form {
      display: flex; gap: 6px; align-items: center;
    }
    .column-form input {
      padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;
    }
    .column-form .btn-sm {
      padding: 4px 10px; border: none; border-radius: 4px; cursor: pointer;
      background: #0066cc; color: white; font-size: 13px;
    }
    .column-form .cancel {
      background: none; color: #666; border: none; cursor: pointer; font-size: 13px;
    }
    .columns {
      display: flex; gap: 16px; padding: 16px 24px; overflow-x: auto;
      min-height: calc(100vh - 80px);
    }
    .column {
      min-width: 280px; max-width: 320px; flex-shrink: 0;
      background: #f5f5f5; border-radius: 8px; padding: 12px;
    }
    .column.drag-over { background: #e0e7ff; }
    .column-header {
      font-weight: bold; margin-bottom: 12px;
      display: flex; justify-content: space-between; align-items: center;
    }
    .column-count { color: #666; font-weight: normal; }
    .task-card {
      background: white; border: 1px solid #ddd; border-radius: 6px;
      padding: 10px; margin-bottom: 8px; cursor: grab;
      transition: box-shadow 0.2s;
    }
    .task-card:active { cursor: grabbing; }
    .task-card:hover { box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
    .task-card .title { font-size: 14px; margin-bottom: 4px; }
    .task-card .inactive { font-size: 12px; color: #999; }
    .task-card .inactive.stale { color: #cc6600; }
    .image-indicator { font-size: 11px; color: #666; margin-top: 2px; }
    .add-task { margin-top: 8px; }
    .add-task input, .add-task textarea {
      width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;
      box-sizing: border-box; font-size: 13px; font-family: inherit;
    }
    .add-task textarea { min-height: 60px; resize: vertical; margin-top: 6px; }
    .add-task .preview-toggle {
      font-size: 12px; color: #0066cc; cursor: pointer; margin-top: 4px;
      display: inline-block;
    }
    .add-task .preview-toggle:hover { text-decoration: underline; }
    .panel-overlay {
      position: fixed; top: 0; right: 0; bottom: 0; width: 420px;
      background: white; border-left: 1px solid #ddd;
      box-shadow: -2px 0 8px rgba(0,0,0,0.1);
      padding: 24px; overflow-y: auto; z-index: 100;
      display: flex; flex-direction: column;
    }
    .panel-overlay .close { cursor: pointer; float: right; font-size: 20px; }
    .panel-overlay h2 { margin: 0 0 16px; }
    .panel-overlay textarea {
      width: 100%; min-height: 80px; padding: 8px; border: 1px solid #ddd;
      border-radius: 4px; box-sizing: border-box; resize: vertical;
      font-family: inherit; font-size: 13px;
    }
    .panel-overlay .btn { margin-top: 8px; }
    .comment { padding: 12px 0; border-bottom: 1px solid #eee; }
    .comment .date { font-size: 12px; color: #999; margin-top: 4px; }
    .comment-actions { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
    .comment-error { color: #cc0000; font-size: 12px; margin-top: 4px; }
    .panel-section { margin-bottom: 16px; }
    .btn {
      padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer;
      background: #0066cc; color: white; font-size: 13px;
    }
    .btn:hover { background: #0052a3; }
  `;

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
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
      if (this.selectedTask) {
        const fresh = this.detail.tasks.find(t => t.id === this.selectedTask!.id);
        if (fresh) this.selectedTask = fresh;
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load board';
    }
  }

  private getMandatoryOrder(): { first: Id<'State'>; second: Id<'State'>; last: Id<'State'> } {
    if (!this.detail) return { first: '' as Id<'State'>, second: '' as Id<'State'>, last: '' as Id<'State'> };
    const sorted = [...this.detail.states].sort((a, b) => a.order - b.order);
    return {
      first: sorted[0]?.id ?? ('' as Id<'State'>),
      second: sorted[1]?.id ?? ('' as Id<'State'>),
      last: sorted[sorted.length - 1]?.id ?? ('' as Id<'State'>),
    };
  }

  private async handleCreateTask(stateId: string): Promise<void> {
    if (!this.newTaskTitle.trim() || !this.detail) return;
    try {
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
      this.error = e instanceof Error ? e.message : 'Failed to create task';
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
    await moveTask.execute({
      taskId,
      newStateId: stateId,
      order: tasksInColumn.length,
    });
    await this.loadBoard();
  }

  private handleStateDragStart(e: DragEvent, state: State): void {
    const mandatory = this.getMandatoryOrder();
    if (state.id === mandatory.first || state.id === mandatory.second || state.id === mandatory.last) {
      e.preventDefault();
      return;
    }
    e.dataTransfer?.setData('application/x-kanbank-state', state.id);
  }

  private async handleStateDrop(e: DragEvent, targetState: State): Promise<void> {
    e.preventDefault();
    e.stopPropagation();
    this.dragOverStateId = '';
    if (!this.detail) return;

    const draggedStateId = e.dataTransfer?.getData('application/x-kanbank-state') as Id<'State'> | undefined;
    if (!draggedStateId || draggedStateId === targetState.id) return;

    const mandatory = this.getMandatoryOrder();
    if (targetState.id === mandatory.first || targetState.id === mandatory.second || targetState.id === mandatory.last) return;

    const sorted = [...this.detail.states].sort((a, b) => a.order - b.order);
    const stateIds = sorted.map(s => s.id);
    const fromIdx = stateIds.indexOf(draggedStateId);
    const toIdx = stateIds.indexOf(targetState.id);
    if (fromIdx === -1 || toIdx === -1) return;

    stateIds.splice(fromIdx, 1);
    stateIds.splice(toIdx, 0, draggedStateId);

    const fixed = [mandatory.first, mandatory.second];
    const custom = stateIds.filter(id => !fixed.includes(id) && id !== mandatory.last);
    const reordered = [...fixed, ...custom, mandatory.last];

    await reorderStates.execute({ boardId: this.detail.board.id, stateIds: reordered });
    await this.loadBoard();
  }

  private async selectTask(task: Task): Promise<void> {
    this.selectedTask = task;
    this.comments = await commentRepo.findByTask(task.id);
    this.commentError = null;
  }

  private async handleAddComment(): Promise<void> {
    if (!this.newComment.trim() || !this.selectedTask) return;
    try {
      this.commentError = null;
      await addComment.execute({
        taskId: this.selectedTask.id,
        markdown: this.newComment.trim(),
      });
      this.newComment = '';
      this.comments = await commentRepo.findByTask(this.selectedTask.id);
      await this.loadBoard();
    } catch (e) {
      this.commentError = e instanceof Error ? e.message : 'Failed to add comment';
    }
  }

  private async handleAttachTaskImage(e: Event): Promise<void> {
    const { files } = (e as CustomEvent).detail;
    if (!files?.length || !this.selectedTask) return;
    for (const file of files) {
      await attachImage.execute(this.selectedTask.id, file);
    }
    await this.loadBoard();
  }

  private async handleDetachTaskImage(e: Event): Promise<void> {
    const { imageId } = (e as CustomEvent).detail;
    if (!imageId || !this.selectedTask) return;
    await detachImage.execute(this.selectedTask.id, imageId);
    await this.loadBoard();
  }

  private async handleAttachCommentImage(e: Event, comment: Comment): Promise<void> {
    const { files } = (e as CustomEvent).detail;
    if (!files?.length) return;
    for (const file of files) {
      await attachCommentImage.execute(comment.id, file);
    }
    this.comments = await commentRepo.findByTask(comment.taskId);
    await this.loadBoard();
  }

  private async handleDetachCommentImage(e: Event, comment: Comment): Promise<void> {
    const { imageId } = (e as CustomEvent).detail;
    if (!imageId) return;
    await detachCommentImage.execute(comment.id, imageId);
    this.comments = await commentRepo.findByTask(comment.taskId);
    await this.loadBoard();
  }

  private async handleCreateState(): Promise<void> {
    if (!this.newColumnTitle.trim() || !this.detail) return;
    try {
      const sorted = [...this.detail.states].sort((a, b) => a.order - b.order);
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

  private closePanel(): void {
    this.selectedTask = null;
    this.comments = [];
    this.commentError = null;
  }

  render() {
    if (this.error) return html`<div style="padding:24px;color:#cc0000;">Error: ${this.error}</div>`;
    if (!this.detail) return html`<div>Loading...</div>`;

    const { board, states, tasks, taskCounts } = this.detail;
    const sortedStates = [...states].sort((a, b) => a.order - b.order);
    const mandatory = this.getMandatoryOrder();

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
        ${board.description ? html`<div class="desc">${board.description}</div>` : ''}
      </div>

      <div class="columns">
        ${sortedStates.map(state => {
          const stateTasks = tasks
            .filter(t => t.stateId === state.id)
            .sort((a, b) => new Date(a.lastActivityAt).getTime() - new Date(b.lastActivityAt).getTime());
          const isMandatory = state.id === mandatory.first || state.id === mandatory.second || state.id === mandatory.last;

          return html`
            <div
              class="column ${this.dragOverStateId === state.id ? 'drag-over' : ''}"
              @dragover="${(e: DragEvent) => this.handleDragOver(e, state.id)}"
              @dragleave="${() => this.handleDragLeave()}"
              @drop="${(e: DragEvent) => this.handleDrop(e, state.id)}"
            >
              <div
                class="column-header"
                ?draggable="${!isMandatory}"
                @dragstart="${(e: DragEvent) => this.handleStateDragStart(e, state)}"
                @dragover="${(e: DragEvent) => { if (!isMandatory) this.handleDragOver(e, state.id); }}"
                @drop="${(e: DragEvent) => { if (!isMandatory) this.handleStateDrop(e, state); }}"
              >
                <span>${state.title}</span>
                <span class="column-count">${taskCounts[state.id] ?? 0}</span>
              </div>

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
                    ${task.images.length ? html`<div class="image-indicator">🖼️ ${task.images.length}</div>` : ''}
                    ${days > 0 ? html`<div class="inactive ${days > 7 ? 'stale' : ''}">${days}d inactive</div>` : ''}
                  </div>
                `;
              })}

              <div class="add-task">
                <input
                  type="text"
                  placeholder="Task title..."
                  .value="${this.newTaskStateId === state.id ? this.newTaskTitle : ''}"
                  @focus="${() => { this.newTaskStateId = state.id; }}"
                  @input="${(e: Event) => { this.newTaskTitle = (e.target as HTMLInputElement).value; }}"
                  @keydown="${(e: KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) this.handleCreateTask(state.id); }}"
                />
                ${this.newTaskStateId === state.id ? html`
                  <textarea
                    placeholder="Description (markdown)..."
                    .value="${this.newTaskDescription}"
                    @input="${(e: Event) => { this.newTaskDescription = (e.target as HTMLTextAreaElement).value; }}"
                  ></textarea>
                  ${this.newTaskDescription.trim() ? html`
                    <span class="preview-toggle" @click="${() => {
                      const el = this.renderRoot.querySelector(`[data-preview="${state.id}"]`) as HTMLElement;
                      if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
                    }}">Preview</span>
                    <div data-preview="${state.id}" style="display:none; margin-top:6px; padding:8px; border:1px solid #eee; border-radius:4px;">
                      <markdown-viewer .content="${this.newTaskDescription}"></markdown-viewer>
                    </div>
                  ` : ''}
                ` : ''}
              </div>
            </div>
          `;
        })}
      </div>

      ${this.selectedTask ? html`
        <div class="panel-overlay">
          <span class="close" @click="${this.closePanel}">&times;</span>
          <h2>${this.selectedTask.title}</h2>
          ${this.selectedTask.description ? html`<markdown-viewer .content="${this.selectedTask.description}"></markdown-viewer>` : ''}
          <image-gallery .images="${this.selectedTask.images}" deletable @image-removed="${this.handleDetachTaskImage}"></image-gallery>
          <image-upload @image-selected="${this.handleAttachTaskImage}"></image-upload>

          <div class="panel-section">
            <h3>Comments</h3>
            ${this.comments.map(c => html`
              <div class="comment">
                <markdown-viewer .content="${c.markdown}"></markdown-viewer>
                <image-gallery .images="${c.images}" deletable @image-removed="${(e: Event) => this.handleDetachCommentImage(e, c)}"></image-gallery>
                <div class="comment-actions">
                  <div class="date">${new Date(c.createdAt).toLocaleDateString()}</div>
                  <image-upload @image-selected="${(e: Event) => this.handleAttachCommentImage(e, c)}"></image-upload>
                </div>
              </div>
            `)}
            ${this.commentError ? html`<div class="comment-error">${this.commentError}</div>` : ''}
          </div>

          <textarea
            placeholder="Add a comment (markdown)..."
            .value="${this.newComment}"
            @input="${(e: Event) => this.newComment = (e.target as HTMLTextAreaElement).value}"
          ></textarea>
          <button class="btn" @click="${this.handleAddComment}">Add Comment</button>
        </div>
      ` : ''}
    `;
  }
}
