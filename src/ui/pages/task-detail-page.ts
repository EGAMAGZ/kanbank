import { html, LitElement, css } from 'lit';
import { PageController } from '@open-cells/page-controller';
import { customElement, state } from 'lit/decorators.js';
import { DexieTaskRepository } from '../../infrastructure/repositories/dexie-task.repository.js';
import { DexieCommentRepository } from '../../infrastructure/repositories/dexie-comment.repository.js';
import { DexieImageRepository } from '../../infrastructure/storage/image-storage.service.js';
import { UpdateTaskUseCase } from '../../application/use-cases/tasks/update-task.js';
import { DeleteTaskUseCase } from '../../application/use-cases/tasks/delete-task.js';
import { AttachImageUseCase } from '../../application/use-cases/tasks/attach-image.js';
import { DetachImageUseCase } from '../../application/use-cases/tasks/detach-image.js';
import { AddCommentUseCase } from '../../application/use-cases/comments/add-comment.js';
import { UpdateCommentUseCase } from '../../application/use-cases/comments/update-comment.js';
import { DeleteCommentUseCase } from '../../application/use-cases/comments/delete-comment.js';
import { AttachImageCommentUseCase } from '../../application/use-cases/comments/attach-image-comment.js';
import { DetachImageCommentUseCase } from '../../application/use-cases/comments/detach-image-comment.js';
import type { Task } from '../../domain/entities/task.entity.js';
import type { Comment } from '../../domain/entities/comment.entity.js';
import type { Id } from '../../shared/types/index.js';
import '../../ui/components/markdown-viewer.js';
import '../../ui/components/image-gallery.js';
import '../../ui/components/image-upload.js';

const taskRepo = new DexieTaskRepository();
const commentRepo = new DexieCommentRepository();
const imageRepo = new DexieImageRepository();
const updateTask = new UpdateTaskUseCase(taskRepo);
const deleteTask = new DeleteTaskUseCase(taskRepo, commentRepo);
const attachImage = new AttachImageUseCase(taskRepo, imageRepo);
const detachImage = new DetachImageUseCase(taskRepo, imageRepo);
const addComment = new AddCommentUseCase(commentRepo, taskRepo);
const updateComment = new UpdateCommentUseCase(commentRepo, taskRepo);
const deleteComment = new DeleteCommentUseCase(commentRepo, taskRepo);
const attachCommentImage = new AttachImageCommentUseCase(commentRepo, taskRepo, imageRepo);
const detachCommentImage = new DetachImageCommentUseCase(commentRepo, taskRepo, imageRepo);

@customElement('task-detail-page')
export class TaskDetailPage extends LitElement {
  pageController = new PageController(this);
  params: Record<string, string> = {};

  @state() private task: Task | null = null;
  @state() private comments: Comment[] = [];
  @state() private error: string | null = null;

  @state() private editingTask = false;
  @state() private editTitle = '';
  @state() private editDescription = '';

  @state() private newComment = '';
  @state() private commentError: string | null = null;

  @state() private editingCommentId: string | null = null;
  @state() private editingCommentText = '';

  static styles = css`
    :host { display: block; max-width: 720px; margin: 0 auto; padding: 24px; }
    .header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .header .back { cursor: pointer; color: #0066cc; font-size: 18px; }
    .header h1 { margin: 0; flex: 1; font-size: 24px; }
    .header .actions { display: flex; gap: 8px; }
    .btn-edit, .btn-delete {
      padding: 4px 10px; border: 2px solid #000; border-radius: 4px;
      cursor: pointer; font-size: 12px; font-weight: bold; background: #fff;
    }
    .btn-delete { color: #cc0000; }
    .btn-edit:hover { background: #f0f0f0; }
    .btn-delete:hover { background: #fff0f0; }
    .section { margin-bottom: 24px; }
    .section h3 { margin: 0 0 8px; font-size: 16px; }
    .description { margin-bottom: 16px; }
    .edit-form input, .edit-form textarea {
      width: 100%; padding: 8px; border: 2px solid #000; border-radius: 4px;
      box-sizing: border-box; font-family: inherit; font-size: 14px;
    }
    .edit-form textarea { min-height: 120px; resize: vertical; margin-top: 8px; }
    .edit-form .btn-row { display: flex; gap: 8px; margin-top: 8px; }
    .btn {
      padding: 6px 14px; border: 2px solid #000; border-radius: 4px;
      cursor: pointer; font-size: 13px; font-weight: bold; background: #0066cc;
      color: white;
    }
    .btn-cancel { background: #fff; color: #000; }
    .btn:hover { opacity: 0.9; }
    .comment {
      padding: 12px 0; border-bottom: 1px solid #eee;
    }
    .comment-header { display: flex; justify-content: space-between; align-items: center; }
    .comment .date { font-size: 12px; color: #999; }
    .comment-actions { display: flex; gap: 6px; margin-top: 6px; }
    .comment-actions button {
      font-size: 11px; padding: 2px 8px; border: 1px solid #ddd; border-radius: 3px;
      background: #fff; cursor: pointer;
    }
    .comment-actions button:hover { background: #f5f5f5; }
    .comment-edit textarea {
      width: 100%; min-height: 80px; padding: 8px; border: 2px solid #000;
      border-radius: 4px; box-sizing: border-box; font-family: inherit; font-size: 13px;
      margin-top: 8px;
    }
    .comment-edit .btn-row { display: flex; gap: 8px; margin-top: 8px; }
    .comment-error { color: #cc0000; font-size: 12px; margin-top: 4px; }
    .add-comment textarea {
      width: 100%; min-height: 80px; padding: 8px; border: 2px solid #000;
      border-radius: 4px; box-sizing: border-box; font-family: inherit; font-size: 13px;
    }
    .preview-toggle {
      font-size: 12px; color: #0066cc; cursor: pointer; margin-top: 4px;
      display: inline-block;
    }
    .preview-toggle:hover { text-decoration: underline; }
    .preview-box {
      margin-top: 8px; padding: 12px; border: 1px solid #eee; border-radius: 4px;
    }
  `;

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  async onPageEnter(): Promise<void> {
    await this.loadTask();
  }

  private async loadTask(): Promise<void> {
    const id = this.params?.id;
    if (!id) return;
    try {
      this.error = null;
      this.task = (await taskRepo.findById(id as Id<'Task'>)) ?? null;
      if (this.task) {
        this.comments = await commentRepo.findByTask(this.task.id);
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load task';
    }
  }

  private goBack(): void {
    if (this.task) {
      this.pageController.navigate('board-detail', { id: this.task.boardId });
    } else {
      this.pageController.navigate('home');
    }
  }

  private startEditTask(): void {
    if (!this.task) return;
    this.editingTask = true;
    this.editTitle = this.task.title;
    this.editDescription = this.task.description;
  }

  private cancelEditTask(): void {
    this.editingTask = false;
  }

  private async saveEditTask(): Promise<void> {
    if (!this.task || !this.editTitle.trim()) return;
    try {
      await updateTask.execute(this.task.id, {
        title: this.editTitle.trim(),
        description: this.editDescription.trim() || undefined,
      });
      this.editingTask = false;
      await this.loadTask();
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to update task';
    }
  }

  private async handleDeleteTask(): Promise<void> {
    if (!this.task) return;
    if (!confirm('Delete this task and all its comments?')) return;
    const boardId = this.task.boardId;
    await deleteTask.execute(this.task.id);
    this.pageController.navigate('board-detail', { id: boardId });
  }

  private async handleAttachTaskImage(e: Event): Promise<void> {
    const { files } = (e as CustomEvent).detail;
    if (!files?.length || !this.task) return;
    for (const file of files) {
      await attachImage.execute(this.task.id, file);
    }
    await this.loadTask();
  }

  private async handleDetachTaskImage(e: Event): Promise<void> {
    const { imageId } = (e as CustomEvent).detail;
    if (!imageId || !this.task) return;
    await detachImage.execute(this.task.id, imageId);
    await this.loadTask();
  }

  private async handleAddComment(): Promise<void> {
    if (!this.newComment.trim() || !this.task) return;
    try {
      this.commentError = null;
      await addComment.execute({ taskId: this.task.id, markdown: this.newComment.trim() });
      this.newComment = '';
      this.comments = await commentRepo.findByTask(this.task.id);
    } catch (e) {
      this.commentError = e instanceof Error ? e.message : 'Failed to add comment';
    }
  }

  private startEditComment(c: Comment): void {
    this.editingCommentId = c.id;
    this.editingCommentText = c.markdown;
  }

  private cancelEditComment(): void {
    this.editingCommentId = null;
    this.editingCommentText = '';
  }

  private async saveEditComment(c: Comment): Promise<void> {
    if (!this.editingCommentText.trim()) return;
    try {
      await updateComment.execute(c.id, { markdown: this.editingCommentText.trim() });
      this.editingCommentId = null;
      this.editingCommentText = '';
      this.comments = await commentRepo.findByTask(c.taskId);
    } catch (e) {
      this.commentError = e instanceof Error ? e.message : 'Failed to update comment';
    }
  }

  private async handleDeleteComment(c: Comment): Promise<void> {
    if (!confirm('Delete this comment?')) return;
    await deleteComment.execute(c.id);
    this.comments = await commentRepo.findByTask(c.taskId);
  }

  private async handleAttachCommentImage(e: Event, c: Comment): Promise<void> {
    const { files } = (e as CustomEvent).detail;
    if (!files?.length) return;
    for (const file of files) {
      await attachCommentImage.execute(c.id, file);
    }
    this.comments = await commentRepo.findByTask(c.taskId);
  }

  private async handleDetachCommentImage(e: Event, c: Comment): Promise<void> {
    const { imageId } = (e as CustomEvent).detail;
    if (!imageId) return;
    await detachCommentImage.execute(c.id, imageId);
    this.comments = await commentRepo.findByTask(c.taskId);
  }

  render() {
    if (this.error) return html`<div style="color:#cc0000;">Error: ${this.error}</div>`;
    if (!this.task) return html`<div>Loading...</div>`;

    return html`
      <div class="header">
        <span class="back" @click="${this.goBack}">&#8592;</span>
        ${this.editingTask ? html`
          <div class="edit-form" style="flex:1;">
            <input type="text" .value="${this.editTitle}" @input="${(e: Event) => { this.editTitle = (e.target as HTMLInputElement).value; }}" />
            <textarea .value="${this.editDescription}" @input="${(e: Event) => { this.editDescription = (e.target as HTMLTextAreaElement).value; }}" placeholder="Description (markdown)..."></textarea>
            ${this.editDescription.trim() ? html`
              <span class="preview-toggle" @click="${() => {
                const el = this.renderRoot.querySelector('.edit-preview') as HTMLElement;
                if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
              }}">Preview</span>
              <div class="preview-box edit-preview" style="display:none;">
                <markdown-viewer .content="${this.editDescription}"></markdown-viewer>
              </div>
            ` : ''}
            <div class="btn-row">
              <button class="btn" @click="${this.saveEditTask}">Save</button>
              <button class="btn btn-cancel" @click="${this.cancelEditTask}">Cancel</button>
            </div>
          </div>
        ` : html`
          <h1>${this.task.title}</h1>
          <div class="actions">
            <button class="btn-edit" @click="${this.startEditTask}">Edit</button>
            <button class="btn-delete" @click="${this.handleDeleteTask}">Delete</button>
          </div>
        `}
      </div>

      ${!this.editingTask && this.task.description ? html`
        <div class="description section">
          <markdown-viewer .content="${this.task.description}"></markdown-viewer>
        </div>
      ` : ''}

      <div class="section">
        <image-gallery .images="${this.task.images}" deletable @image-removed="${this.handleDetachTaskImage}"></image-gallery>
        <image-upload @image-selected="${this.handleAttachTaskImage}"></image-upload>
      </div>

      <div class="section">
        <h3>Comments (${this.comments.length})</h3>
        ${this.comments.map(c => html`
          <div class="comment">
            ${this.editingCommentId === c.id ? html`
              <div class="comment-edit">
                <textarea .value="${this.editingCommentText}" @input="${(e: Event) => { this.editingCommentText = (e.target as HTMLTextAreaElement).value; }}"></textarea>
                <div class="btn-row">
                  <button class="btn" @click="${() => this.saveEditComment(c)}">Save</button>
                  <button class="btn btn-cancel" @click="${this.cancelEditComment}">Cancel</button>
                </div>
              </div>
            ` : html`
              <div class="comment-header">
                <div class="date">${new Date(c.createdAt).toLocaleDateString()}</div>
                <div class="comment-actions">
                  <button @click="${() => this.startEditComment(c)}">Edit</button>
                  <button @click="${() => this.handleDeleteComment(c)}">Delete</button>
                </div>
              </div>
              <markdown-viewer .content="${c.markdown}"></markdown-viewer>
              <image-gallery .images="${c.images}" deletable @image-removed="${(e: Event) => this.handleDetachCommentImage(e, c)}"></image-gallery>
              <div class="comment-actions">
                <image-upload @image-selected="${(e: Event) => this.handleAttachCommentImage(e, c)}"></image-upload>
              </div>
            `}
          </div>
        `)}
        ${this.commentError ? html`<div class="comment-error">${this.commentError}</div>` : ''}
      </div>

      <div class="section add-comment">
        <textarea
          placeholder="Add a comment (markdown)..."
          .value="${this.newComment}"
          @input="${(e: Event) => { this.newComment = (e.target as HTMLTextAreaElement).value; }}"
          @keydown="${(e: KeyboardEvent) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) this.handleAddComment(); }}"
        ></textarea>
        <button class="btn" style="margin-top:8px;" @click="${this.handleAddComment}">Add Comment</button>
      </div>
    `;
  }
}
