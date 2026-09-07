import { css, html, LitElement } from "lit";
import { PageController } from "@open-cells/page-controller";
import { customElement, state } from "lit/decorators.js";
import { DexieTaskRepository } from "../../infrastructure/repositories/dexie-task.repository.js";
import { DexieCommentRepository } from "../../infrastructure/repositories/dexie-comment.repository.js";
import { DexieImageRepository } from "../../infrastructure/storage/image-storage.service.js";
import { DexieStateRepository } from "../../infrastructure/repositories/dexie-state.repository.js";
import { DexieBoardRepository } from "../../infrastructure/repositories/dexie-board.repository.js";
import { DexieStepRepository } from "../../infrastructure/repositories/dexie-step.repository.js";
import { DexieTimelineRepository } from "../../infrastructure/repositories/dexie-timeline.repository.js";
import { UpdateTaskUseCase } from "../../application/use-cases/tasks/update-task.js";
import { DeleteTaskUseCase } from "../../application/use-cases/tasks/delete-task.js";
import { AttachImageUseCase } from "../../application/use-cases/tasks/attach-image.js";
import { DetachImageUseCase } from "../../application/use-cases/tasks/detach-image.js";
import { AddCommentUseCase } from "../../application/use-cases/comments/add-comment.js";
import { UpdateCommentUseCase } from "../../application/use-cases/comments/update-comment.js";
import { DeleteCommentUseCase } from "../../application/use-cases/comments/delete-comment.js";
import { AttachImageCommentUseCase } from "../../application/use-cases/comments/attach-image-comment.js";
import { DetachImageCommentUseCase } from "../../application/use-cases/comments/detach-image-comment.js";
import { CreateStepUseCase } from "../../application/use-cases/steps/create-step.js";
import { UpdateStepUseCase } from "../../application/use-cases/steps/update-step.js";
import { DeleteStepUseCase } from "../../application/use-cases/steps/delete-step.js";
import { AddTimelineEntryUseCase } from "../../application/use-cases/timeline/add-timeline-entry.js";
import type { Task } from "../../domain/entities/task.entity.js";
import type { Comment } from "../../domain/entities/comment.entity.js";
import type { Step } from "../../domain/entities/step.entity.js";
import type { TimelineEntry } from "../../domain/entities/timeline-entry.entity.js";
import type { State } from "../../domain/entities/state.entity.js";
import type { Board } from "../../domain/entities/board.entity.js";
import type { Id } from "../../shared/types/index.js";
import { CURRENT_USER } from "../../ui/components/task-card.js";
import "../../ui/components/wysiwyg-editor.js";
import "../../ui/components/done-stamp.js";
import "../../ui/components/not-now-stamp.js";
import "../../ui/components/step-checklist.js";
import "../../ui/components/attachment-list.js";
import "../../ui/components/state-selector.js";
import "../../ui/components/quick-actions.js";
import "../../ui/components/keycap.js";
import { isEditableTarget, keycapLabel, mod } from "../helpers/shortcuts.js";
import "../../ui/components/not-now-stamp.js";

const taskRepo = new DexieTaskRepository();
const commentRepo = new DexieCommentRepository();
const imageRepo = new DexieImageRepository();
const stateRepo = new DexieStateRepository();
const boardRepo = new DexieBoardRepository();
const stepRepo = new DexieStepRepository();
const timelineRepo = new DexieTimelineRepository();
const updateTask = new UpdateTaskUseCase(taskRepo);
const deleteTask = new DeleteTaskUseCase(
  taskRepo,
  commentRepo,
  imageRepo,
  stepRepo,
  timelineRepo,
);
const attachImage = new AttachImageUseCase(taskRepo, imageRepo);
const detachImage = new DetachImageUseCase(taskRepo, imageRepo);
const addComment = new AddCommentUseCase(commentRepo, taskRepo);
const updateComment = new UpdateCommentUseCase(commentRepo, taskRepo);
const deleteComment = new DeleteCommentUseCase(commentRepo, taskRepo);
const attachCommentImage = new AttachImageCommentUseCase(
  commentRepo,
  taskRepo,
  imageRepo,
);
const detachCommentImage = new DetachImageCommentUseCase(
  commentRepo,
  taskRepo,
  imageRepo,
);
const createStep = new CreateStepUseCase(stepRepo);
const updateStep = new UpdateStepUseCase(stepRepo);
const deleteStep = new DeleteStepUseCase(stepRepo);
const addTimeline = new AddTimelineEntryUseCase(timelineRepo);

const STATE_COLORS: Record<string, string> = {
  "Maybe?": "#FFFFFF",
};

function getStateColor(state: State): string {
  return STATE_COLORS[state.title] ?? state.color;
}

@customElement("task-detail-page")
export class TaskDetailPage extends LitElement {
  pageController = new PageController(this);
  params: Record<string, string> = {};

  @state()
  private task: Task | null = null;
  @state()
  private comments: Comment[] = [];
  @state()
  private steps: Step[] = [];
  @state()
  private timeline: TimelineEntry[] = [];
  private historyShowAll = false;
  @state()
  private states: State[] = [];
  @state()
  private boards: Board[] = [];
  @state()
  private _showBoardDropdown = false;
  @state()
  private error: string | null = null;

  @state()
  private editingTaskDesc = false;
  @state()
  private editTitle = "";
  @state()
  private editDueDate = "";
  @state()
  private editDescription = "";

  @state()
  private newCommentHtml = "";

  @state()
  private editingCommentId: string | null = null;
  @state()
  private editingCommentText = "";

  private boundKeydown: ((e: KeyboardEvent) => void) | null = null;

  private get _isDone(): boolean {
    if (!this.task || !this.states.length) return false;
    const doneState = this.states.find((s) => s.title === "Done");
    return !!doneState && this.task.stateId === doneState.id;
  }

  private get _isNotNow(): boolean {
    if (!this.task || !this.states.length) return false;
    const notNowState = this.states.find((s) => s.title === "Not now");
    return !!notNowState && this.task.stateId === notNowState.id;
  }

  private _handleClickOutside = (e: MouseEvent) => {
    const dropdown = this.renderRoot.querySelector(".board-dropdown");
    const btn = this.renderRoot.querySelector(".board-btn");
    if (
      dropdown &&
      !dropdown.contains(e.target as Node) &&
      btn &&
      !btn.contains(e.target as Node)
    ) {
      this._showBoardDropdown = false;
      document.removeEventListener("click", this._handleClickOutside);
    }
  };

  static styles = css`
    :host {
      display: block;
      height: 100%;
      overflow: hidden;
    }

    .page-wrapper {
      overflow-y: auto;
      height: 100%;
      padding: var(--space-xl) var(--space-2xl);
    }

    .main-content {
      width: 75%;
      max-width: 960px;
      margin: 0 auto;
    }

    .back {
      display: inline-flex;
      align-items: center;
      gap: var(--space-xs);
      margin-bottom: var(--space-md);
      cursor: pointer;
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      font-weight: 700;
      border: 3px solid var(--color-black);
      padding: var(--space-xs) var(--space-md);
      background: var(--color-white);
      transition: background var(--ease-brutal);
    }

    .back:hover {
      background: var(--color-bg);
    }

    .header {
      display: flex;
      align-items: flex-start;
      gap: var(--space-lg);
      margin-bottom: var(--space-lg);
    }

    .header-left {
      flex: 1;
      min-width: 0;
    }

    .title-block {
      flex: 1;
      position: relative;
      border: 4px solid var(--color-black);
      box-shadow: 6px 6px 0 var(--color-black);
      padding: var(--space-lg);
      background: var(--color-white);
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
    }

    .title-block .title-row {
      display: flex;
      gap: var(--space-lg);
    }

    .title-block .title-content {
      flex: 1;
      min-width: 0;
    }

    .corner-btn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 4px solid var(--color-black);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      background: var(--color-white);
      transition: background var(--ease-brutal), transform var(--ease-brutal),
        box-shadow var(--ease-brutal);
      box-shadow: 4px 4px 0 var(--color-black);
      padding: 0;
      flex-shrink: 0;
      align-self: flex-start;
      margin-top: var(--space-lg);
    }

    .corner-btn:hover {
      transform: translate(1px, 1px);
      box-shadow: 3px 3px 0 var(--color-black);
    }

    .corner-btn:active {
      transform: translate(4px, 4px);
      box-shadow: 0 0 0 var(--color-black);
    }

    .corner-btn.gold-btn.active {
      background: var(--color-gold);
    }

    .corner-btn.pin-btn.active {
      background: var(--color-black);
    }

    .title-block .state-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
    }

    .title-block.gold {
      background: var(--color-gold);
    }

    .title-block h1 {
      margin: 0;
      font-family: var(--font-display);
      font-weight: 900;
      font-size: var(--text-2xl);
      letter-spacing: -0.03em;
      line-height: var(--leading-tight);
      word-break: break-word;
    }

    .delete-task-wrapper {
      display: flex;
      justify-content: center;
      margin-top: var(--space-lg);
      padding-bottom: var(--space-2xl);
    }

    .delete-task-btn {
      padding: var(--space-sm) var(--space-xl);
      border: 3px solid var(--color-black);
      background: var(--color-white);
      color: var(--color-error);
      cursor: pointer;
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      font-weight: 700;
      transition: background var(--ease-brutal), color var(--ease-brutal), transform
        var(--ease-brutal), box-shadow var(--ease-brutal);
      box-shadow: 4px 4px 0 var(--color-black);
    }

    .delete-task-btn:hover {
      background: var(--color-error);
      color: var(--color-white);
    }

    .delete-task-btn:active {
      transform: translate(4px, 4px);
      box-shadow: 0 0 0 var(--color-black);
    }

    .meta-row {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      margin-top: var(--space-md);
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

    .meta-item.gold-bg {
      background: var(--color-gold);
    }

    .meta-item.cat {
      background: var(--color-accent);
      color: var(--color-white);
    }

    .meta-avatar {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--color-black);
      background: var(--color-accent-2);
      color: var(--color-white);
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 700;
    }

    .section {
      margin-bottom: var(--space-2xl);
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      margin-bottom: var(--space-md);
      border-bottom: 3px solid var(--color-black);
      padding-bottom: var(--space-xs);
    }

    .section-header h3 {
      margin: 0;
      font-family: var(--font-display);
      font-size: var(--text-lg);
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .section-header .count {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      font-weight: 700;
      border: 2px solid var(--color-black);
      padding: 1px var(--space-xs);
      background: var(--color-white);
    }

    .auto-close-msg {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-3);
      border: 2px dashed var(--color-warning);
      padding: var(--space-xs) var(--space-sm);
      margin-bottom: var(--space-md);
    }

    .edit-form input {
      width: 100%;
      padding: var(--space-sm) var(--space-md);
      border: 3px solid var(--color-black);
      box-sizing: border-box;
      font-family: var(--font-body);
      font-size: var(--text-lg);
      font-weight: 700;
      outline: none;
      background: var(--color-white);
      margin-bottom: var(--space-sm);
    }

    .edit-form input:focus {
      box-shadow: 3px 3px 0 var(--color-accent);
    }

    .edit-form .btn-row {
      display: flex;
      gap: var(--space-sm);
      margin-top: var(--space-sm);
    }

    .btn {
      padding: var(--space-sm) var(--space-md);
      border: 3px solid var(--color-black);
      cursor: pointer;
      font-size: var(--text-sm);
      font-weight: 700;
      font-family: var(--font-mono);
      transition: transform var(--ease-brutal), box-shadow var(--ease-brutal);
    }

    .btn-primary {
      box-shadow: 4px 4px 0 var(--color-black);
      background: var(--color-accent);
      color: var(--color-white);
    }

    .btn-primary:hover {
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0 var(--color-black);
    }

    .btn-primary:active {
      transform: translate(4px, 4px);
      box-shadow: 0 0 0 var(--color-black);
    }

    .btn-cancel {
      box-shadow: none;
      background: var(--color-white);
    }

    .btn-cancel:hover {
      background: var(--color-bg);
    }

    .desc-editor-wrap {
      margin-bottom: var(--space-lg);
    }

    .comment {
      padding: var(--space-md);
      border: 3px solid var(--color-black);
      margin-bottom: var(--space-md);
      background: var(--color-white);
      position: relative;
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

    .comment-body {
      font-size: var(--text-base);
      line-height: var(--leading-loose);
    }

    .timeline {
      position: relative;
    }

    .timeline-item {
      display: flex;
      gap: var(--space-sm);
      padding: var(--space-sm) 0;
      border-bottom: 2px solid var(--color-black);
      align-items: flex-start;
    }

    .timeline-icon {
      width: 22px;
      height: 22px;
      border: 2px solid var(--color-black);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .timeline-body {
      flex: 1;
    }

    .timeline-msg {
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 600;
    }

    .timeline-meta {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-3);
    }

    .add-comment-wrap {
      border: 3px solid var(--color-black);
      background: var(--color-white);
    }

    .comment-editor-actions {
      display: flex;
      justify-content: flex-end;
      padding: var(--space-sm);
      border-top: 3px solid var(--color-black);
      background: var(--color-bg);
    }

    .not-now-notice {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      font-weight: 700;
      border: 3px solid #555;
      background: #eee;
      padding: var(--space-sm);
      margin-bottom: var(--space-md);
      display: flex;
      align-items: center;
      gap: var(--space-sm);
    }

    .task-card-wrapper {
      position: relative;
    }

    .board-btn {
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: var(--color-white);
    }

    .board-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .board-btn-wrap {
      position: relative;
      display: inline-block;
    }

    .board-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      z-index: 100;
      min-width: 160px;
      border: 3px solid var(--color-black);
      background: var(--color-white);
      box-shadow: 4px 4px 0 var(--color-black);
    }

    .board-dropdown.gold {
      background: var(--color-gold);
    }

    .board-dd-option {
      display: block;
      width: 100%;
      text-align: left;
      padding: var(--space-xs) var(--space-sm);
      border: none;
      border-bottom: 1px solid var(--color-bg);
      background: var(--color-white);
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      cursor: pointer;
    }

    .board-dd-option:last-child {
      border-bottom: none;
    }

    .board-dd-option:hover {
      background: var(--color-bg);
    }

    .board-dropdown.gold .board-dd-option {
      background: var(--color-gold);
    }

    .board-dropdown.gold .board-dd-option:hover {
      background: var(--color-accent);
      color: var(--color-white);
    }

    .board-dd-option:disabled {
      opacity: 0.5;
      cursor: default;
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.boundKeydown = this._handleGlobalKeydown.bind(this);
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
    await this._loadTask();
  }

  private _handleGlobalKeydown(e: KeyboardEvent): void {
    if (this.getAttribute("state") !== "active") return;
    if (this.editingTaskDesc) {
      if (e.key === "Escape") {
        e.preventDefault();
        this.cancelEditTask();
        return;
      }
      if (mod(e) && e.key === "Enter") {
        e.preventDefault();
        void this.saveEditTask();
      }
      return;
    }

    if (isEditableTarget(e)) return;

    if (e.key === "Escape") {
      this.goBack();
      return;
    }

    if (e.code === "KeyE" && !mod(e)) {
      e.preventDefault();
      this.startEditTask();
      return;
    }
    if (e.code === "KeyD" && !mod(e)) {
      e.preventDefault();
      this.markAsDone();
      return;
    }
    if (e.code === "KeyP" && e.shiftKey && !mod(e)) {
      e.preventDefault();
      this.togglePin();
      return;
    }
    if (e.code === "KeyG" && e.shiftKey && !mod(e)) {
      e.preventDefault();
      this.toggleGold();
      return;
    }
    if (e.key === "ArrowLeft" && !mod(e)) {
      e.preventDefault();
      this.goBack();
      return;
    }
  }

  private async _loadTask(): Promise<void> {
    const id = this.params?.id;
    if (!id) return;
    try {
      this.error = null;
      this.task = (await taskRepo.findById(id as Id<"Task">)) ?? null;
      if (this.task) {
        this.comments = await commentRepo.findByTask(this.task.id);
        this.steps = await stepRepo.findByTask(this.task.id);
        const boardStates = await stateRepo.findByBoard(this.task.boardId);
        this.states = boardStates.sort((a, b) => a.order - b.order);
        this.boards = await boardRepo.findAll();
        this.timeline = await timelineRepo.findByTask(this.task.id);
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
    this.editingTaskDesc = true;
    this.editTitle = this.task.title;
    this.editDueDate = this.task.dueDate ?? "";
    this.editDescription = this.task.description ?? "";
    setTimeout(() => {
      const editor = this.renderRoot.querySelector("#desc-editor") as any;
      if (editor && editor.setValue) {
        editor.setValue(this.editDescription);
      }
      const titleInput = this.renderRoot.querySelector(
        "#edit-title-input",
      ) as HTMLInputElement;
      if (titleInput) titleInput.focus();
    }, 50);
  }

  private cancelEditTask(): void {
    this.editingTaskDesc = false;
  }

  private _handleCommentEditorChange(e: CustomEvent): void {
    this.newCommentHtml = e.detail.html;
  }

  private _handleDescEditorChange(e: CustomEvent): void {
    this.editDescription = e.detail.html;
  }

  private async saveEditTask(): Promise<void> {
    if (!this.task || !this.editTitle.trim()) return;
    try {
      await updateTask.execute(this.task.id, {
        title: this.editTitle.trim(),
        description: this.editDescription || undefined,
        dueDate: this.editDueDate || null,
      });
      await addTimeline.execute({
        taskId: this.task.id,
        type: "updated",
        userId: CURRENT_USER.initials,
        userName: CURRENT_USER.name,
        message: "edited task",
      });
      this.editingTaskDesc = false;
      await this._loadTask();
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to update task";
    }
  }

  private async markAsDone(): Promise<void> {
    if (!this.task) return;
    const doneState = this.states.find((s) => s.title === "Done");
    if (!doneState) return;
    try {
      await updateTask.execute(this.task.id, { stateId: doneState.id });
      await addTimeline.execute({
        taskId: this.task.id,
        type: "completed",
        toStateId: doneState.id,
        userId: CURRENT_USER.initials,
        userName: CURRENT_USER.name,
        message: "marked as done",
      });
      await this._loadTask();
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to mark as done";
    }
  }

  private toggleBoardDropdown(): void {
    if (this._isDone) return;
    this._showBoardDropdown = !this._showBoardDropdown;
    if (this._showBoardDropdown) {
      setTimeout(
        () => document.addEventListener("click", this._handleClickOutside),
        0,
      );
    } else {
      document.removeEventListener("click", this._handleClickOutside);
    }
  }

  private async selectBoard(boardId: Id<"Board">): Promise<void> {
    this._showBoardDropdown = false;
    document.removeEventListener("click", this._handleClickOutside);
    if (!this.task || boardId === this.task.boardId) return;

    const newBoardStates = await stateRepo.findByBoard(boardId);
    const maybeState = newBoardStates.find((s) => s.title === "Maybe?");
    if (!maybeState) return;

    const oldBoardName =
      this.boards.find((b) => b.id === this.task!.boardId)?.title ?? "?";
    const newBoardName =
      this.boards.find((b) => b.id === boardId)?.title ?? "?";

    try {
      await updateTask.execute(this.task.id, {
        boardId,
        stateId: maybeState.id,
      });
      await addTimeline.execute({
        taskId: this.task.id,
        type: "moved",
        userId: CURRENT_USER.initials,
        userName: CURRENT_USER.name,
        message: `moved from board "${oldBoardName}" to "${newBoardName}"`,
      });
      await this._loadTask();
    } catch (e) {
      this.error =
        e instanceof Error ? e.message : "Failed to move task to board";
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
    await this._loadTask();
  }

  private async handleDetachTaskImage(e: Event): Promise<void> {
    const { imageId } = (e as CustomEvent).detail;
    if (!imageId || !this.task) return;
    await detachImage.execute(this.task.id, imageId);
    await this._loadTask();
  }

  private async toggleGold(): Promise<void> {
    if (!this.task) return;
    const newGold = !this.task.isGold;
    await updateTask.execute(this.task.id, { isGold: newGold });
    await addTimeline.execute({
      taskId: this.task.id,
      type: "gold-toggled",
      userId: CURRENT_USER.initials,
      userName: CURRENT_USER.name,
      message: newGold ? "★ golden ticket" : "removed gold",
    });
    await this._loadTask();
  }

  private async togglePin(): Promise<void> {
    if (!this.task) return;
    const newPin = !this.task.pinned;
    await updateTask.execute(this.task.id, { pinned: newPin });
    await this._loadTask();
    window.dispatchEvent(new CustomEvent("pinned-changed"));
  }

  private async handleStateChange(e: Event): Promise<void> {
    if (!this.task) return;
    const { stateId } = (e as CustomEvent).detail;
    const oldState = this.states.find((s) => s.id === this.task!.stateId);
    const newState = this.states.find((s) => s.id === stateId);
    if (stateId === this.task.stateId) return;
    await updateTask.execute(this.task.id, { stateId });
    await addTimeline.execute({
      taskId: this.task.id,
      type: "moved",
      fromStateId: oldState?.id,
      toStateId: stateId,
      userId: CURRENT_USER.initials,
      userName: CURRENT_USER.name,
      message: `moved from "${oldState?.title ?? "?"}" to "${
        newState?.title ?? "?"
      }"`,
    });
    await this._loadTask();
  }

  private async handleAddComment(): Promise<void> {
    if (!this.newCommentHtml.trim() || !this.task) return;
    try {
      this.error = null;
      await addComment.execute({
        taskId: this.task.id,
        markdown: this.newCommentHtml.trim(),
      });
      await addTimeline.execute({
        taskId: this.task.id,
        type: "commented",
        userId: CURRENT_USER.initials,
        userName: CURRENT_USER.name,
        message: "added a comment",
      });
      this.newCommentHtml = "";
      this.comments = await commentRepo.findByTask(this.task.id);
      const editor = this.renderRoot.querySelector(
        "#new-comment-editor",
      ) as any;
      if (editor && editor.setValue) editor.setValue("");
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to add comment";
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
      await updateComment.execute(c.id, {
        markdown: this.editingCommentText.trim(),
      });
      this.editingCommentId = null;
      this.editingCommentText = "";
      this.comments = await commentRepo.findByTask(c.taskId);
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to update comment";
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

  private async handleStepAdd(e: Event): Promise<void> {
    if (!this.task) return;
    const { text } = (e as CustomEvent).detail;
    await createStep.execute({
      taskId: this.task.id,
      text,
      order: this.steps.length,
    });
    await this._loadTask();
  }

  private async handleStepToggle(e: Event): Promise<void> {
    const { id, checked } = (e as CustomEvent).detail;
    await updateStep.execute(id, { checked });
    await this._loadTask();
  }

  private async handleStepUpdate(e: Event): Promise<void> {
    const { id, text } = (e as CustomEvent).detail;
    await updateStep.execute(id, { text });
    await this._loadTask();
  }

  private async handleStepDelete(e: Event): Promise<void> {
    const { id } = (e as CustomEvent).detail;
    await deleteStep.execute(id);
    await this._loadTask();
  }

  private _formatDate(dateStr: string): string {
    const date = dateStr.includes("T")
      ? new Date(dateStr)
      : new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  private _stampDate(dateStr: string): string {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })
      .format(new Date(dateStr));
  }

  private _relativeTime(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    return `${days}d ago`;
  }

  private _inactiveDays(dateStr: string): number {
    const now = new Date();
    const d = new Date(dateStr);
    return Math.floor((now.getTime() - d.getTime()) / 86400000);
  }

  render() {
    if (this.error) {
      return html`
        <div
          style="padding:var(--space-xl);color:var(--color-error);font-family:var(--font-mono);">Error: ${this
            .error}</div>
      `;
    }
    if (!this.task) {
      return html`
        <div
          style="padding:var(--space-xl);color:var(--color-text-3);font-family:var(--font-mono);">Loading...</div>
      `;
    }

    const inactive = this._inactiveDays(this.task.lastActivityAt);
    const autoCloseMsg = inactive > 0
      ? `Moves to 'Not Now' in ${
        Math.max(0, 7 - inactive)
      } days if there's no activity`
      : "";
    const currentState = this.states.find((s) => s.id === this.task!.stateId);
    return html`
      <div class="page-wrapper">
        <!-- Back button -->
        <div class="back" @click="${this.goBack}">
          ← Back to board <keycap-el key="Esc"></keycap-el>
        </div>

        <!-- Auto-close message -->
        ${autoCloseMsg
          ? html`<div class="auto-close-msg">⏳ ${autoCloseMsg}</div>`
          : ""}

        <!-- Not now notice -->
        ${this.task.notNowSince
          ? html`
            <div class="not-now-notice">
              <span style="font-size:14px;">📬</span>
              Auto-moved to "Not now" on ${this._formatDate(
                this.task.notNowSince,
              )}
            </div>
          `
          : ""}

        <!-- Header -->
        <div class="header">
          <button class="corner-btn gold-btn ${this.task.isGold
            ? "active"
            : ""}" @click="${this.toggleGold}" title="${`${
              this.task.isGold ? "★ Golden ticket" : "Mark as gold"
            } (${keycapLabel("⇧G")})`}">
            ${this.task.isGold ? "★" : "☆"}
          </button>
          <div class="header-left">
            <div class="title-block ${this.task.isGold ? "gold" : ""}">
              ${currentState
                ? html`<div class="state-bar" style="background:${
                  getStateColor(currentState)
                }"></div>`
                : ""}
              ${this._isDone
                ? html`<done-stamp date="${
                  this._stampDate(this.task.updatedAt)
                }" author="Auto" bg-color="#166534"></done-stamp>`
                : ""}
              ${!this.editingTaskDesc && this._isNotNow
                ? html`
                  <not-now-stamp date="${this._stampDate(
                    this.task.updatedAt,
                  )}" author="Auto"
                    bg-color="#8C8C8C"></not-now-stamp>
                `
                : ""}
              <div class="title-row">
                <div class="title-content">
                  <div style="display:flex;align-items:center;gap:var(--space-sm);margin-bottom:var(--space-xs);flex-wrap:wrap;">
                    <span class="meta-item">#${String(this.task.seq)
                      .padStart(3, "0")}</span>
                    <div class="board-btn-wrap">
                      <button class="meta-item board-btn ${this.task.isGold ? "gold-bg" : ""}" ?disabled="${this._isDone}" @click="${this.toggleBoardDropdown}">
                        ${this.boards.find(b => b.id === this.task!.boardId)?.title ?? "?"} ▾
                      </button>
                      ${this._showBoardDropdown ? html`
                        <div class="board-dropdown ${this.task.isGold ? "gold" : ""}">
                          ${this.boards.map(b => html`
                            <button class="board-dd-option" @click="${() => this.selectBoard(b.id)}" ?disabled="${b.id === this.task!.boardId}">
                              ${b.title}${b.id === this.task!.boardId ? " ✓" : ""}
                            </button>
                          `)}
                        </div>
                      ` : ""}
                    </div>
                    ${this.task.category
                      ? html`<span class="meta-item cat">${this.task.category}</span>`
                      : ""}
                    ${this.task.isGold
                      ? html`<span class="meta-item gold-bg">★ GOLDEN TICKET</span>`
                      : ""}
                  </div>
                  ${this.editingTaskDesc
                    ? html`
                      <input id="edit-title-input" type="text" .value="${this.editTitle}"
                        @input="${(e: InputEvent) => { this.editTitle = (e.target as HTMLInputElement).value; }}"
                        @keydown="${(e: KeyboardEvent) => {
                          if (e.key === "Enter") this.saveEditTask();
                          if (e.key === "Escape") this.cancelEditTask();
                        }}"
                        style="width:100%;font-family:var(--font-display);font-weight:900;font-size:var(--text-2xl);border:3px solid var(--color-black);padding:var(--space-sm);margin-bottom:var(--space-sm);"
                      />
                    `
                    : html`
                      <h1>${this.task.title}</h1>
                    `}
                  ${this.editingTaskDesc
                    ? html`
                      <div class="desc-editor-wrap"
                        @keydown="${(e: KeyboardEvent) => {
                          if (mod(e) && e.key === "Enter") {
                            e.preventDefault();
                            void this.saveEditTask();
                          }
                        }}">
                        <wysiwyg-editor id="desc-editor" .value="${this.editDescription}"
                          placeholder="Write a description..."
                          @editor-change="${this._handleDescEditorChange}"></wysiwyg-editor>
                      </div>
                    `
                    : this.task.description
                    ? html`
                      <div style="font-size:var(--text-base);line-height:var(--leading-loose);margin-top:var(--space-sm);"
                        .innerHTML="${this.task.description}"></div>
                    `
                    : html`
                      <div style="font-family:var(--font-mono);font-size:var(--text-xs);color:var(--color-text-3);margin-top:var(--space-sm);">No description</div>
                    `}
                  <div style="margin-top:var(--space-md);">
                    <step-checklist
                      .steps="${this.steps}"
                      @step-add="${this.handleStepAdd}"
                      @step-toggle="${this.handleStepToggle}"
                      @step-update="${this.handleStepUpdate}"
                      @step-delete="${this.handleStepDelete}"
                    ></step-checklist>
                  </div>
                </div>
                ${this.editingTaskDesc ? "" : html`
                  <state-selector
                    .states="${this.states}"
                    activeStateId="${this.task.stateId}"
                    @state-change="${this.handleStateChange}"
                  ></state-selector>
                `}
              </div>
              <div class="meta-row" style="margin:0;">
                <span class="meta-avatar">${CURRENT_USER.initials}</span>
                <span class="meta-item">created ${this._relativeTime(
                  this.task.createdAt,
                )}</span>
                <span class="meta-item">updated ${this._relativeTime(
                  this.task.updatedAt,
                )}</span>
                ${this.editingTaskDesc
                  ? html`
                    <input type="date" .value="${this.editDueDate}"
                      @input="${(e: InputEvent) => { this.editDueDate = (e.target as HTMLInputElement).value; }}"
                      style="width:auto;padding:var(--space-xs) var(--space-sm);border:3px solid var(--color-black);font-family:var(--font-mono);font-size:var(--text-xs);"
                    />
                    <button class="btn btn-primary" @click="${this.saveEditTask}" style="margin-left:auto;">Save</button>
                    <button class="btn btn-cancel" @click="${this.cancelEditTask}">Cancel</button>
                  `
                  : this.task.dueDate
                  ? html`<span class="meta-item">due ${
                    this._formatDate(this.task.dueDate)
                  }</span>`
                  : ""}
              </div>
            </div>

            <div style="margin-top:var(--space-md);margin-bottom:var(--space-lg);">
              <quick-actions
                ?hidePrimary="${this._isDone || this.editingTaskDesc}"
                @mark-done="${this.markAsDone}"
                @edit-task="${this.startEditTask}"
              ></quick-actions>
            </div>
          </div>
          <button class="corner-btn pin-btn ${this.task.pinned
            ? "active"
            : ""}" @click="${this.togglePin}" title="${`${
              this.task.pinned ? "📌 Pinned" : "Pin task"
            } (${keycapLabel("⇧P")})`}">
            ${this.task.pinned ? "📌" : "📍"}
          </button>
        </div>

        <div class="main-content">
          <!-- Attachments -->
          <div class="section">
            <div class="section-header">
              <h3>Attachments</h3>
              <span class="count">${this.task.images.length}</span>
            </div>
            <attachment-list
              .images="${this.task.images}"
              deletable
              @attachment-remove="${this.handleDetachTaskImage}"
              @attachment-add="${this.handleAttachTaskImage}"
            ></attachment-list>
          </div>

          <!-- Comments -->
          <div class="section">
            <div class="section-header">
              <h3>Comments</h3>
              <span class="count">${this.comments.length}</span>
            </div>

            ${this.comments.map((c) =>
              html`
                <div class="comment">
                  ${this.editingCommentId === c.id
                    ? html`
                      <div>
                        <textarea
                          style="width:100%;min-height:80px;padding:var(--space-sm);border:3px solid var(--color-black);font-family:var(--font-body);font-size:var(--text-sm);"
                          .value="${this.editingCommentText}"
                          @input="${(e: InputEvent) => {
                            this.editingCommentText =
                              (e.target as HTMLTextAreaElement).value;
                          }}"
                        ></textarea>
                        <div class="btn-row" style="margin-top:var(--space-sm);">
                          <button class="btn btn-primary" @click="${() =>
                            this.saveEditComment(c)}">Save</button>
                          <button class="btn btn-cancel" @click="${this
                            .cancelEditComment}">Cancel</button>
                        </div>
                      </div>
                    `
                    : html`
                      <div class="comment-header">
                        <div class="comment-author">
                          <span class="comment-avatar">${CURRENT_USER
                            .initials}</span>
                          <span class="comment-date">${this._relativeTime(
                            c.createdAt,
                          )}</span>
                        </div>
                        <div class="comment-actions">
                          <button @click="${() =>
                            this.startEditComment(c)}">Edit</button>
                          <button @click="${() =>
                            this.handleDeleteComment(c)}">Delete</button>
                        </div>
                      </div>
                      <div class="comment-body" .innerHTML="${c
                        .markdown}"></div>
                      <attachment-list .images="${c.images}" deletable
                        @attachment-remove="${(e: Event) =>
                          this.handleDetachCommentImage(e, c)}"
                        @attachment-add="${(e: Event) =>
                          this.handleAttachCommentImage(e, c)}"
                      ></attachment-list>
                    `}
                </div>
              `
            )}

            <div style="margin-top:var(--space-md);">
              <div class="add-comment-wrap">
                <wysiwyg-editor id="new-comment-editor" .value="${this
                  .newCommentHtml}" placeholder="Write a comment..." .minHeight="${80}" @editor-change="${this
                  ._handleCommentEditorChange}"></wysiwyg-editor>
                <div class="comment-editor-actions">
                  <button class="btn btn-primary" @click="${this
                    .handleAddComment}" ?disabled="${!this.newCommentHtml
                    .trim()}">Add Comment</button>
                </div>
              </div>
            </div>

            ${this.error
              ? html`
                <div
                  style="color:var(--color-error);font-size:var(--text-sm);margin-top:var(--space-sm);font-family:var(--font-mono);">${this
                    .error}</div>
              `
              : ""}
          </div>

          <!-- Full History Timeline -->
          <div class="section">
            <div class="section-header">
              <h3>Full History</h3>
              <span class="count">${this.timeline.length}</span>
            </div>
            <div class="timeline">
              ${this.timeline.length === 0
                ? html`
                  <div
                    style="font-family:var(--font-mono);font-size:var(--text-xs);color:var(--color-text-3);">No history yet</div>
                `
                : ""}
              ${this.timeline.slice(0, this.historyShowAll ? undefined : 5).map(
                (entry) =>
                  html`
                    <div class="timeline-item">
                      <span class="timeline-icon">${entry.type === "created"
                        ? "+"
                        : entry.type === "moved"
                        ? "→"
                        : entry.type === "commented"
                        ? "💬"
                        : entry.type === "completed"
                        ? "✓"
                        : entry.type === "auto-closed"
                        ? "📬"
                        : entry.type === "gold-toggled"
                        ? "★"
                        : "✎"}</span>
                      <div class="timeline-body">
                        <div class="timeline-msg">${entry.message}</div>
                        <div class="timeline-meta">${entry.userName} · ${this
                          ._relativeTime(entry.timestamp)}</div>
                      </div>
                    </div>
                  `,
              )}
              ${this.timeline.length > 5 && !this.historyShowAll
                ? html`
                  <div
                    style="text-align:center;padding:var(--space-sm);cursor:pointer;font-family:var(--font-mono);font-size:var(--text-xs);font-weight:700;border-top:2px solid var(--color-black);"
                    @click="${() => {
                      this.historyShowAll = true;
                    }}"
                  >+ ${this.timeline.length - 5} more</div>
                `
                : ""}
            </div>
          </div>

          <div class="delete-task-wrapper">
            <button class="delete-task-btn" @click="${this
              .handleDeleteTask}">Delete this task</button>
          </div>
        </div>
      </div>
    `;
  }
}
