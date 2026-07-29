import { css, html, LitElement } from "lit";
import { PageController } from "@open-cells/page-controller";
import { customElement, state } from "lit/decorators.js";
import { DexieTaskRepository } from "../../infrastructure/repositories/dexie-task.repository.js";
import { DexieCommentRepository } from "../../infrastructure/repositories/dexie-comment.repository.js";
import { DexieImageRepository } from "../../infrastructure/storage/image-storage.service.js";
import { UpdateTaskUseCase } from "../../application/use-cases/tasks/update-task.js";
import { DeleteTaskUseCase } from "../../application/use-cases/tasks/delete-task.js";
import { AttachImageUseCase } from "../../application/use-cases/tasks/attach-image.js";
import { DetachImageUseCase } from "../../application/use-cases/tasks/detach-image.js";
import { AddCommentUseCase } from "../../application/use-cases/comments/add-comment.js";
import { UpdateCommentUseCase } from "../../application/use-cases/comments/update-comment.js";
import { DeleteCommentUseCase } from "../../application/use-cases/comments/delete-comment.js";
import { AttachImageCommentUseCase } from "../../application/use-cases/comments/attach-image-comment.js";
import { DetachImageCommentUseCase } from "../../application/use-cases/comments/detach-image-comment.js";
import type { Task } from "../../domain/entities/task.entity.js";
import type { Comment } from "../../domain/entities/comment.entity.js";
import type { Id } from "../../shared/types/index.js";
import "../../ui/components/markdown-viewer.js";
import "../../ui/components/image-gallery.js";
import "../../ui/components/image-upload.js";
import { CURRENT_USER } from "../../ui/components/task-card.js";

const taskRepo = new DexieTaskRepository();
const commentRepo = new DexieCommentRepository();
const imageRepo = new DexieImageRepository();
const updateTask = new UpdateTaskUseCase(taskRepo);
const deleteTask = new DeleteTaskUseCase(taskRepo, commentRepo, imageRepo);
const attachImage = new AttachImageUseCase(taskRepo, imageRepo);
const detachImage = new DetachImageUseCase(taskRepo, imageRepo);
const addComment = new AddCommentUseCase(commentRepo, taskRepo);
const updateComment = new UpdateCommentUseCase(commentRepo, taskRepo);
const deleteComment = new DeleteCommentUseCase(commentRepo, taskRepo);
const attachCommentImage = new AttachImageCommentUseCase(commentRepo, taskRepo, imageRepo);
const detachCommentImage = new DetachImageCommentUseCase(commentRepo, taskRepo, imageRepo);

@customElement("task-detail-page")
export class TaskDetailPage extends LitElement {
  pageController = new PageController(this);
  params: Record<string, string> = {};

  @state()
  private task: Task | null = null;
  @state()
  private comments: Comment[] = [];
  @state()
  private error: string | null = null;

  @state()
  private editingTask = false;
  @state()
  private editTitle = "";
  @state()
  private editDescription = "";

  @state()
  private newComment = "";
  @state()
  private commentError: string | null = null;

  @state()
  private editingCommentId: string | null = null;
  @state()
  private editingCommentText = "";

  @state()
  private editDueDate = "";

  static styles = css`
    :host {
      display: block;
      max-width: 780px;
      margin: 0 auto;
      padding: var(--space-2xl) var(--gutter-lg);
      overflow-y: auto;
      height: 100%;
    }

    .header {
      display: flex;
      align-items: flex-start;
      gap: var(--space-lg);
      margin-bottom: var(--space-2xl);
    }

    .back {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: var(--line-thick) solid var(--color-black);
      cursor: pointer;
      font-size: 18px;
      font-weight: 700;
      background: var(--color-white);
      flex-shrink: 0;
      margin-top: var(--space-xs);
      transition: background var(--ease-brutal);
    }

    .back:hover {
      background: var(--color-bg);
    }

    .title-block {
      flex: 1;
      border: var(--line-thicker) solid var(--color-black);
      box-shadow: var(--shadow-brutal-md);
      padding: var(--space-xl);
      background: var(--color-white);
    }

    .title-block.gold {
      background: var(--color-gold);
      border-width: var(--line-thicker);
    }

    .title-block h1 {
      margin: 0;
      font-family: var(--font-display);
      font-weight: 900;
      font-size: var(--text-2xl);
      letter-spacing: -0.03em;
      line-height: var(--leading-tight);
    }

    .actions {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
      flex-shrink: 0;
    }

    .action-btn {
      padding: var(--space-xs) var(--space-md);
      border: var(--line-thick) solid var(--color-black);
      cursor: pointer;
      font-size: var(--text-xs);
      font-weight: 700;
      font-family: var(--font-mono);
      background: var(--color-white);
      transition: background var(--ease-brutal);
      text-align: center;
    }

    .action-btn:hover {
      background: var(--color-bg);
    }

    .action-btn.primary {
      background: var(--color-accent);
      color: var(--color-white);
    }

    .action-btn.primary:hover {
      background: var(--color-black);
    }

    .action-btn.danger:hover {
      background: var(--color-error);
      color: var(--color-white);
    }

    .action-btn.gold-active {
      background: var(--color-gold);
    }

    .meta-row {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      margin-bottom: var(--space-lg);
      flex-wrap: wrap;
    }

    .meta-item {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-2);
      border: 2px solid var(--color-black);
      padding: 2px var(--space-sm);
    }

    .section {
      margin-bottom: var(--space-2xl);
    }

    .section h3 {
      margin: 0 0 var(--space-md);
      font-family: var(--font-display);
      font-size: var(--text-lg);
      font-weight: 800;
      letter-spacing: -0.02em;
      border-bottom: var(--line-thick) solid var(--color-black);
      padding-bottom: var(--space-xs);
    }

    .description {
      margin-bottom: var(--space-2xl);
      font-size: var(--text-base);
      line-height: var(--leading-loose);
    }

    .edit-form input,
    .edit-form textarea {
      width: 100%;
      padding: var(--space-sm) var(--space-md);
      border: var(--line-thick) solid var(--color-black);
      box-sizing: border-box;
      font-family: var(--font-body);
      font-size: var(--text-sm);
      outline: none;
      background: var(--color-white);
    }

    .edit-form input:focus,
    .edit-form textarea:focus {
      box-shadow: 3px 3px 0 var(--color-accent);
    }

    .edit-form textarea {
      min-height: 120px;
      resize: vertical;
      margin-top: var(--space-sm);
    }

    .edit-form .btn-row {
      display: flex;
      gap: var(--space-sm);
      margin-top: var(--space-sm);
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
    }

    .btn-cancel:hover {
      background: var(--color-bg);
    }

    .comment {
      padding: var(--space-md);
      border: var(--line-thick) solid var(--color-black);
      margin-bottom: var(--space-md);
      background: var(--color-white);
    }

    .comment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-sm);
    }

    .comment-author {
      display: flex;
      align-items: center;
      gap: var(--space-xs);
    }

    .comment-avatar {
      width: 20px;
      height: 20px;
      border: 2px solid var(--color-black);
      background: var(--color-accent-2);
      color: var(--color-white);
      font-family: var(--font-mono);
      font-size: 8px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .comment-date {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-3);
    }

    .comment-actions {
      display: flex;
      gap: var(--space-xs);
    }

    .comment-actions button {
      font-size: var(--text-xs);
      padding: 1px var(--space-xs);
      border: 2px solid var(--color-black);
      background: var(--color-white);
      cursor: pointer;
      font-family: var(--font-mono);
      font-weight: 500;
      transition: background var(--ease-brutal);
    }

    .comment-actions button:hover {
      background: var(--color-bg);
    }

    .comment-edit textarea {
      width: 100%;
      min-height: 80px;
      padding: var(--space-sm) var(--space-md);
      border: var(--line-thick) solid var(--color-black);
      box-sizing: border-box;
      font-family: var(--font-body);
      font-size: var(--text-sm);
      margin-top: var(--space-sm);
      outline: none;
    }

    .comment-edit textarea:focus {
      box-shadow: 3px 3px 0 var(--color-accent);
    }

    .comment-edit .btn-row {
      display: flex;
      gap: var(--space-sm);
      margin-top: var(--space-sm);
    }

    .comment-error {
      color: var(--color-error);
      font-size: var(--text-sm);
      margin-top: var(--space-sm);
      font-family: var(--font-mono);
    }

    .add-comment textarea {
      width: 100%;
      min-height: 80px;
      padding: var(--space-sm) var(--space-md);
      border: var(--line-thick) solid var(--color-black);
      box-sizing: border-box;
      font-family: var(--font-body);
      font-size: var(--text-sm);
      outline: none;
      background: var(--color-white);
    }

    .add-comment textarea:focus {
      box-shadow: 3px 3px 0 var(--color-accent);
    }

    .edit-form .field-row {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      margin-top: var(--space-sm);
    }

    .edit-form .field-row label {
      font-size: var(--text-xs);
      font-weight: 700;
      font-family: var(--font-mono);
      min-width: 80px;
    }

    .edit-form .field-row input[type="date"] {
      padding: var(--space-xs) var(--space-sm);
      border: var(--line-thick) solid var(--color-black);
      font-family: var(--font-body);
      font-size: var(--text-sm);
      outline: none;
    }

    .edit-form .field-row input[type="date"]:focus {
      box-shadow: 3px 3px 0 var(--color-accent);
    }

  `;

  async onPageEnter(): Promise<void> {
    await this.loadTask();
  }

  private async loadTask(): Promise<void> {
    const id = this.params?.id;
    if (!id) return;
    try {
      this.error = null;
      this.task = (await taskRepo.findById(id as Id<"Task">)) ?? null;
      if (this.task) {
        this.comments = await commentRepo.findByTask(this.task.id);
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to load task";
    }
  }

  private goBack(): void {
    if (this.task) {
      this.pageController.navigate("board-detail", { id: this.task.boardId });
    } else {
      this.pageController.navigate("home");
    }
  }

  private startEditTask(): void {
    if (!this.task) return;
    this.editingTask = true;
    this.editTitle = this.task.title;
    this.editDescription = this.task.description;
    this.editDueDate = this.task.dueDate ?? "";
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
        dueDate: this.editDueDate || null,
      });
      this.editingTask = false;
      await this.loadTask();
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to update task";
    }
  }

  private async handleDeleteTask(): Promise<void> {
    if (!this.task) return;
    if (!confirm("Delete this task and all its comments?")) return;
    const boardId = this.task.boardId;
    await deleteTask.execute(this.task.id);
    this.pageController.navigate("board-detail", { id: boardId });
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

  private async toggleGold(): Promise<void> {
    if (!this.task) return;
    await updateTask.execute(this.task.id, { isGold: !this.task.isGold });
    await this.loadTask();
  }

  private async handleAddComment(): Promise<void> {
    if (!this.newComment.trim() || !this.task) return;
    try {
      this.commentError = null;
      await addComment.execute({ taskId: this.task.id, markdown: this.newComment.trim() });
      this.newComment = "";
      this.comments = await commentRepo.findByTask(this.task.id);
    } catch (e) {
      this.commentError = e instanceof Error ? e.message : "Failed to add comment";
    }
  }

  private startEditComment(c: Comment): void {
    this.editingCommentId = c.id;
    this.editingCommentText = c.markdown;
  }

  private cancelEditComment(): void {
    this.editingCommentId = null;
    this.editingCommentText = "";
  }

  private async saveEditComment(c: Comment): Promise<void> {
    if (!this.editingCommentText.trim()) return;
    try {
      await updateComment.execute(c.id, { markdown: this.editingCommentText.trim() });
      this.editingCommentId = null;
      this.editingCommentText = "";
      this.comments = await commentRepo.findByTask(c.taskId);
    } catch (e) {
      this.commentError = e instanceof Error ? e.message : "Failed to update comment";
    }
  }

  private async handleDeleteComment(c: Comment): Promise<void> {
    if (!confirm("Delete this comment?")) return;
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
    if (this.error) {
      return html`<div style="padding:var(--space-xl);color:var(--color-error);font-family:var(--font-mono);">Error: ${this.error}</div>`;
    }
    if (!this.task) {
      return html`<div style="padding:var(--space-xl);color:var(--color-text-3);font-family:var(--font-mono);">Loading...</div>`;
    }

    return html`
      <div class="header">
        <span class="back" @click="${this.goBack}">←</span>
        ${this.editingTask
          ? html`
            <div class="edit-form" style="flex:1;">
              <input type="text" .value="${this.editTitle}"
                @input="${(e: Event) => { this.editTitle = (e.target as HTMLInputElement).value; }}"
              />
              <textarea .value="${this.editDescription}"
                @input="${(e: Event) => { this.editDescription = (e.target as HTMLTextAreaElement).value; }}"
                placeholder="Description (markdown)..."
              ></textarea>
              <div class="field-row">
                <label for="edit-due">Due date</label>
                <input id="edit-due" type="date" .value="${this.editDueDate}"
                  @input="${(e: Event) => { this.editDueDate = (e.target as HTMLInputElement).value; }}"
                />
              </div>
              <div class="btn-row">
                <button class="btn btn-primary" @click="${this.saveEditTask}">Save</button>
                <button class="btn btn-cancel" @click="${this.cancelEditTask}">Cancel</button>
              </div>
            </div>
          `
          : html`
            <div class="title-block ${this.task.isGold ? "gold" : ""}">
              <h1>${this.task.title}</h1>
            </div>
            <div class="actions">
              <button class="action-btn" @click="${this.startEditTask}">EDIT</button>
              <button class="action-btn ${this.task.isGold ? "gold-active" : ""}" @click="${this.toggleGold}">
                ${this.task.isGold ? "★ GOLD" : "☆ GOLD"}
              </button>
              <button class="action-btn danger" @click="${this.handleDeleteTask}">DELETE</button>
            </div>
          `}
      </div>

      ${!this.editingTask
        ? html`
          <div class="meta-row">
            <span class="meta-item">#${CURRENT_USER.initials}</span>
            <span class="meta-item">created ${new Date(this.task.createdAt).toLocaleDateString()}</span>
            ${this.task.dueDate ? html`<span class="meta-item">due ${new Date(this.task.dueDate).toLocaleDateString()}</span>` : ""}
            ${this.task.isGold ? html`<span class="meta-item" style="background:var(--color-gold);">★ GOLDEN TICKET</span>` : ""}
          </div>

        `
        : ""}

      ${!this.editingTask && this.task.description
        ? html`
          <div class="section">
            <h3>Description</h3>
            <div class="description">
              <markdown-viewer .content="${this.task.description}"></markdown-viewer>
            </div>
          </div>
        `
        : ""}

      <div class="section">
        <h3>Images</h3>
        <image-gallery .images="${this.task.images}" deletable
          @image-removed="${this.handleDetachTaskImage}"></image-gallery>
        <image-upload @image-selected="${this.handleAttachTaskImage}"></image-upload>
      </div>

      <div class="section">
        <h3>Comments (${this.comments.length})</h3>
        ${this.comments.map((c) => html`
          <div class="comment">
            ${this.editingCommentId === c.id
              ? html`
                <div class="comment-edit">
                  <textarea .value="${this.editingCommentText}"
                    @input="${(e: Event) => { this.editingCommentText = (e.target as HTMLTextAreaElement).value; }}"
                  ></textarea>
                  <div class="btn-row">
                    <button class="btn btn-primary" @click="${() => this.saveEditComment(c)}">Save</button>
                    <button class="btn btn-cancel" @click="${this.cancelEditComment}">Cancel</button>
                  </div>
                </div>
              `
              : html`
                <div class="comment-header">
                  <div class="comment-author">
                    <span class="comment-avatar">${CURRENT_USER.initials}</span>
                    <span class="comment-date">${new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div class="comment-actions">
                    <button @click="${() => this.startEditComment(c)}">Edit</button>
                    <button @click="${() => this.handleDeleteComment(c)}">Delete</button>
                  </div>
                </div>
                <markdown-viewer .content="${c.markdown}"></markdown-viewer>
                <image-gallery .images="${c.images}" deletable
                  @image-removed="${(e: Event) => this.handleDetachCommentImage(e, c)}"></image-gallery>
                <image-upload @image-selected="${(e: Event) => this.handleAttachCommentImage(e, c)}"></image-upload>
              `}
          </div>
        `)}
        ${this.commentError ? html`<div class="comment-error">${this.commentError}</div>` : ""}
      </div>

      <div class="section add-comment">
        <h3>Add Comment</h3>
        <textarea
          placeholder="Write a comment (markdown)..."
          .value="${this.newComment}"
          @input="${(e: Event) => { this.newComment = (e.target as HTMLTextAreaElement).value; }}"
          @keydown="${(e: KeyboardEvent) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { this.handleAddComment(); } }}"
        ></textarea>
        <button class="btn btn-primary" style="margin-top:var(--space-sm);" @click="${this.handleAddComment}">Add Comment</button>
      </div>
    `;
  }
}
