import { html, LitElement, css } from 'lit';
import { PageController } from '@open-cells/page-controller';
import { customElement, state } from 'lit/decorators.js';
import { GetBoardUseCase, type BoardDetail } from '../../application/use-cases/boards/get-board.js';
import { CreateTaskUseCase } from '../../application/use-cases/tasks/create-task.js';
import { MoveTaskUseCase } from '../../application/use-cases/tasks/move-task.js';
import { AddCommentUseCase } from '../../application/use-cases/comments/add-comment.js';
import { DexieBoardRepository } from '../../infrastructure/repositories/dexie-board.repository.js';
import { DexieStateRepository } from '../../infrastructure/repositories/dexie-state.repository.js';
import { DexieTaskRepository } from '../../infrastructure/repositories/dexie-task.repository.js';
import { DexieCommentRepository } from '../../infrastructure/repositories/dexie-comment.repository.js';
import { inactiveDays } from '../../shared/utils/dates.js';
import type { Task } from '../../domain/entities/task.entity.js';
import type { Comment } from '../../domain/entities/comment.entity.js';

const boardRepo = new DexieBoardRepository();
const stateRepo = new DexieStateRepository();
const taskRepo = new DexieTaskRepository();
const commentRepo = new DexieCommentRepository();
const getBoard = new GetBoardUseCase(boardRepo, stateRepo, taskRepo);
const createTask = new CreateTaskUseCase(taskRepo);
const moveTask = new MoveTaskUseCase(taskRepo);
const addComment = new AddCommentUseCase(commentRepo, taskRepo);

@customElement('board-detail-page')
export class BoardDetailPage extends LitElement {
  pageController = new PageController(this);
  params: Record<string, string> = {};

  @state() private detail: BoardDetail | null = null;
  @state() private error: string | null = null;
  @state() private selectedTask: Task | null = null;
  @state() private comments: Comment[] = [];
  @state() private newTaskTitle = '';
  @state() private newTaskStateId = '';
  @state() private newComment = '';
  @state() private dragOverStateId = '';

  static styles = css`
    :host { display: block; }
    .board-header { padding: 16px 24px; border-bottom: 1px solid #ddd; }
    .board-header h1 { margin: 0; }
    .board-header .back { cursor: pointer; color: #0066cc; margin-right: 8px; }
    .columns { display: flex; gap: 16px; padding: 16px 24px; overflow-x: auto; min-height: calc(100vh - 80px); }
    .column {
      min-width: 280px; max-width: 320px; flex-shrink: 0;
      background: #f5f5f5; border-radius: 8px; padding: 12px;
    }
    .column.drag-over { background: #e0e7ff; }
    .column-header { font-weight: bold; margin-bottom: 12px; display: flex; justify-content: space-between; }
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
    .add-task { margin-top: 8px; }
    .add-task input {
      width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;
    }
    .panel-overlay {
      position: fixed; top: 0; right: 0; bottom: 0; width: 400px;
      background: white; border-left: 1px solid #ddd; box-shadow: -2px 0 8px rgba(0,0,0,0.1);
      padding: 24px; overflow-y: auto; z-index: 100;
    }
    .panel-overlay .close { cursor: pointer; float: right; font-size: 20px; }
    .panel-overlay h2 { margin: 0 0 16px; }
    .panel-overlay textarea {
      width: 100%; min-height: 80px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;
      box-sizing: border-box; resize: vertical;
    }
    .panel-overlay .btn { margin-top: 8px; }
    .comment { padding: 8px 0; border-bottom: 1px solid #eee; }
    .comment .markdown { white-space: pre-wrap; font-size: 14px; }
    .comment .date { font-size: 12px; color: #999; margin-top: 4px; }
    .btn { padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; background: #0066cc; color: white; font-size: 13px; }
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
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load board';
    }
  }

  private async handleCreateTask(stateId: string): Promise<void> {
    if (!this.newTaskTitle.trim() || !this.detail) return;
    await createTask.execute({
      boardId: this.detail.board.id,
      stateId,
      title: this.newTaskTitle.trim(),
    });
    this.newTaskTitle = '';
    this.newTaskStateId = '';
    await this.loadBoard();
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

  private async selectTask(task: Task): Promise<void> {
    this.selectedTask = task;
    this.comments = await commentRepo.findByTask(task.id);
  }

  private async handleAddComment(): Promise<void> {
    if (!this.newComment.trim() || !this.selectedTask) return;
    await addComment.execute({
      taskId: this.selectedTask.id,
      markdown: this.newComment.trim(),
    });
    this.newComment = '';
    this.comments = await commentRepo.findByTask(this.selectedTask.id);
    await this.loadBoard();
  }

  private closePanel(): void {
    this.selectedTask = null;
    this.comments = [];
  }

  render() {
    if (this.error) return html`<div style="padding:24px;color:#cc0000;">Error: ${this.error}</div>`;
    if (!this.detail) return html`<div>Loading...</div>`;

    const { board, states, tasks, taskCounts } = this.detail;
    const sortedStates = [...states].sort((a, b) => a.order - b.order);

    return html`
      <div class="board-header">
        <span class="back" @click="${() => this.pageController.navigate('home')}">&#8592;</span>
        <h1>${board.title}</h1>
        ${board.description ? html`<p>${board.description}</p>` : ''}
      </div>

      <div class="columns">
        ${sortedStates.map(state => {
          const stateTasks = tasks
            .filter(t => t.stateId === state.id)
            .sort((a, b) => new Date(a.lastActivityAt).getTime() - new Date(b.lastActivityAt).getTime());

          return html`
            <div
              class="column ${this.dragOverStateId === state.id ? 'drag-over' : ''}"
              @dragover="${(e: DragEvent) => this.handleDragOver(e, state.id)}"
              @dragleave="${() => this.handleDragLeave()}"
              @drop="${(e: DragEvent) => this.handleDrop(e, state.id)}"
            >
              <div class="column-header">
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
                    ${days > 0 ? html`<div class="inactive ${days > 7 ? 'stale' : ''}">${days}d inactive</div>` : ''}
                  </div>
                `;
              })}

              <div class="add-task">
                <input
                  type="text"
                  placeholder="Add task..."
                  .value="${this.newTaskStateId === state.id ? this.newTaskTitle : ''}"
                  @focus="${() => { this.newTaskStateId = state.id; }}"
                  @input="${(e: Event) => { this.newTaskTitle = (e.target as HTMLInputElement).value; }}"
                  @keydown="${(e: KeyboardEvent) => { if (e.key === 'Enter') this.handleCreateTask(state.id); }}"
                />
              </div>
            </div>
          `;
        })}
      </div>

      ${this.selectedTask ? html`
        <div class="panel-overlay">
          <span class="close" @click="${this.closePanel}">&times;</span>
          <h2>${this.selectedTask.title}</h2>
          ${this.selectedTask.description ? html`<p>${this.selectedTask.description}</p>` : ''}

          <h3>Comments</h3>
          ${this.comments.map(c => html`
            <div class="comment">
              <div class="markdown">${c.markdown}</div>
              <div class="date">${new Date(c.createdAt).toLocaleDateString()}</div>
            </div>
          `)}

          <textarea
            placeholder="Add a comment..."
            .value="${this.newComment}"
            @input="${(e: Event) => this.newComment = (e.target as HTMLTextAreaElement).value}"
          ></textarea>
          <button class="btn" @click="${this.handleAddComment}">Add Comment</button>
        </div>
      ` : ''}
    `;
  }
}
