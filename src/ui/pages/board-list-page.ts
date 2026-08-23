import { css, html, LitElement } from "lit";
import { PageController } from "@open-cells/page-controller";
import { customElement, state } from "lit/decorators.js";
import { ListBoardsUseCase } from "../../application/use-cases/boards/list-boards.js";
import { CreateBoardUseCase } from "../../application/use-cases/boards/create-board.js";
import { DeleteBoardUseCase } from "../../application/use-cases/boards/delete-board.js";
import { DexieBoardRepository } from "../../infrastructure/repositories/dexie-board.repository.js";
import { DexieStateRepository } from "../../infrastructure/repositories/dexie-state.repository.js";
import { DexieTaskRepository } from "../../infrastructure/repositories/dexie-task.repository.js";
import { DexieCommentRepository } from "../../infrastructure/repositories/dexie-comment.repository.js";
import { DexieImageRepository } from "../../infrastructure/storage/image-storage.service.js";
import { DexieStepRepository } from "../../infrastructure/repositories/dexie-step.repository.js";
import { DexieTimelineRepository } from "../../infrastructure/repositories/dexie-timeline.repository.js";
import {
  type ActivityEvent,
  activityStore,
} from "../services/activity-store.js";
import type { Board } from "../../domain/entities/board.entity.js";
import "../../ui/components/keycap.js";

const boardRepo = new DexieBoardRepository();
const stateRepo = new DexieStateRepository();
const taskRepo = new DexieTaskRepository();
const commentRepo = new DexieCommentRepository();
const imageRepo = new DexieImageRepository();
const stepRepo = new DexieStepRepository();
const timelineRepo = new DexieTimelineRepository();
const listBoards = new ListBoardsUseCase(boardRepo);
const createBoard = new CreateBoardUseCase(boardRepo, stateRepo);
const deleteBoard = new DeleteBoardUseCase(
  boardRepo,
  stateRepo,
  taskRepo,
  commentRepo,
  imageRepo,
  stepRepo,
  timelineRepo,
);

const BENTO_COLORS = ["#1E40AF", "#D97706", "#059669", "#7C3AED", "#DC2626"];

@customElement("board-list-page")
export class BoardListPage extends LitElement {
  pageController = new PageController(this);

  @state()
  private boards: Board[] = [];
  @state()
  private showCreateForm = false;
  @state()
  private newTitle = "";
  @state()
  private newDescription = "";

  @state()
  private activityEvents: ActivityEvent[] = [];

  private _pollTimer: ReturnType<typeof setInterval> | null = null;

  private _openCreateForm = (): void => {
    this.showCreateForm = true;
  };

  static styles = css`
    :host {
      display: block;
      padding: var(--space-2xl) var(--gutter-lg);
      max-width: var(--max-width);
      margin: 0 auto;
      overflow-y: auto;
      height: 100%;
    }

    .page-title {
      font-family: var(--font-display);
      font-weight: 900;
      font-size: var(--text-5xl);
      letter-spacing: -0.04em;
      line-height: var(--leading-tight);
      margin-bottom: var(--space-2xl);
      border-bottom: var(--line-thicker) solid var(--color-black);
      padding-bottom: var(--space-lg);
      display: flex;
      align-items: center;
      gap: var(--space-md);
    }

    .page-title .count {
      font-family: var(--font-mono);
      font-size: var(--text-lg);
      font-weight: 400;
      color: var(--color-text-2);
      background: var(--color-white);
      border: var(--line-thick) solid var(--color-black);
      padding: 2px var(--space-sm);
    }

    /* Activity feed 3-column layout */
    .activity-section {
      margin-bottom: var(--space-3xl);
    }

    .activity-section-title {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: var(--text-2xl);
      letter-spacing: -0.03em;
      margin-bottom: var(--space-lg);
      border-bottom: 4px solid var(--color-black);
      padding-bottom: var(--space-sm);
    }

    .activity-columns {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: var(--space-lg);
    }

    .activity-col {
      border: 4px solid var(--color-black);
      box-shadow: 6px 6px 0 var(--color-black);
      background: var(--color-white);
      display: flex;
      flex-direction: column;
    }

    .activity-col-header {
      padding: var(--space-sm) var(--space-md);
      font-family: var(--font-display);
      font-weight: 800;
      font-size: var(--text-base);
      color: var(--color-white);
      border-bottom: 4px solid var(--color-black);
    }

    .activity-col-header.added {
      background: var(--color-accent);
    }
    .activity-col-header.updated {
      background: var(--color-warning);
    }
    .activity-col-header.done {
      background: var(--color-success);
    }

    .activity-col-body {
      flex: 1;
      min-height: 120px;
    }

    .activity-col-body:empty::after {
      content: "No activity";
      display: block;
      padding: var(--space-md);
      text-align: center;
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-3);
    }

    .activity-item {
      display: flex;
      align-items: flex-start;
      gap: var(--space-sm);
      padding: var(--space-sm) var(--space-md);
      border-bottom: 2px solid var(--color-black);
    }

    .activity-icon {
      width: 20px;
      height: 20px;
      border: 2px solid var(--color-black);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-mono);
      font-size: 9px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .activity-icon.created {
      background: var(--color-accent);
      color: var(--color-white);
    }
    .activity-icon.moved {
      background: var(--color-accent);
      color: var(--color-white);
    }
    .activity-icon.updated {
      background: var(--color-warning);
      color: var(--color-white);
    }
    .activity-icon.commented {
      background: var(--color-accent-2);
      color: var(--color-white);
    }
    .activity-icon.completed {
      background: var(--color-success);
      color: var(--color-white);
    }

    .activity-info {
      flex: 1;
      min-width: 0;
    }

    .activity-label {
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .activity-time {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-3);
    }

    .board-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--space-lg);
    }

    .board-card {
      border: var(--line-thicker) solid var(--color-black);
      box-shadow: var(--shadow-brutal-md);
      padding: var(--space-xl);
      cursor: pointer;
      background: var(--color-white);
      transition: transform var(--ease-brutal), box-shadow var(--ease-brutal);
      position: relative;
      display: flex;
      flex-direction: column;
    }

    .board-card .color-strip {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
    }

    .board-card:hover {
      transform: translate(3px, 3px);
      box-shadow: 3px 3px 0 var(--color-black);
    }

    .board-card:active {
      transform: translate(6px, 6px);
      box-shadow: 0 0 0 var(--color-black);
    }

    .board-card h3 {
      margin: var(--space-md) 0 var(--space-sm);
      font-family: var(--font-display);
      font-weight: 800;
      font-size: var(--text-xl);
      letter-spacing: -0.03em;
      line-height: var(--leading-snug);
    }

    .board-card p {
      margin: 0;
      color: var(--color-text-2);
      font-size: var(--text-sm);
      line-height: var(--leading-normal);
      flex: 1;
    }

    .board-card .card-meta {
      margin-top: var(--space-md);
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-3);
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: var(--line-thick) solid var(--color-black);
      padding-top: var(--space-sm);
    }

    .board-card--new {
      border: var(--line-thicker) dashed var(--color-black);
      box-shadow: none;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-sm);
      color: var(--color-text-2);
      cursor: pointer;
      min-height: 200px;
      transition: color var(--ease-brutal), border-color var(--ease-brutal),
        background var(--ease-brutal);
      background: var(--color-white);
    }

    .board-card--new:hover {
      color: var(--color-black);
      border-color: var(--color-black);
      background: var(--color-bg);
      transform: none;
      box-shadow: none;
    }

    .board-card--new .new-icon {
      font-family: var(--font-mono);
      font-size: var(--text-3xl);
      font-weight: 700;
      line-height: 1;
    }

    .board-card--new .new-label {
      font-size: var(--text-base);
      font-weight: 700;
    }

    .card-delete-btn {
      position: absolute;
      top: var(--space-sm);
      right: var(--space-sm);
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: var(--line-thick) solid var(--color-black);
      background: var(--color-white);
      cursor: pointer;
      font-size: 12px;
      color: var(--color-text-3);
      transition: color var(--ease-brutal), background var(--ease-brutal);
      opacity: 0;
      padding: 0;
      line-height: 1;
    }

    .board-card:hover .card-delete-btn {
      opacity: 1;
    }

    .card-delete-btn:hover {
      color: var(--color-white);
      background: var(--color-error);
    }

    .create-form {
      width: 100%;
    }

    .create-form input,
    .create-form textarea {
      display: block;
      width: 100%;
      padding: var(--space-sm) var(--space-md);
      border: var(--line-thick) solid var(--color-black);
      font-family: var(--font-body);
      font-size: var(--text-sm);
      margin-bottom: var(--space-sm);
      outline: none;
      background: var(--color-white);
      transition: box-shadow var(--ease-brutal);
    }

    .create-form input:focus,
    .create-form textarea:focus {
      box-shadow: 3px 3px 0 var(--color-accent);
    }

    .create-form textarea {
      min-height: 80px;
      resize: vertical;
    }

    .form-actions {
      display: flex;
      gap: var(--space-sm);
    }

    .btn-create {
      padding: var(--space-sm) var(--space-md);
      border: var(--line-thick) solid var(--color-black);
      box-shadow: var(--shadow-brutal);
      background: var(--color-accent);
      color: var(--color-white);
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 700;
      cursor: pointer;
      transition: transform var(--ease-brutal), box-shadow var(--ease-brutal);
    }

    .btn-create:hover {
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0 var(--color-black);
    }

    .btn-create:active {
      transform: translate(5px, 5px);
      box-shadow: 0 0 0 var(--color-black);
    }

    .btn-cancel {
      padding: var(--space-sm) var(--space-md);
      border: var(--line-thick) solid var(--color-black);
      background: var(--color-white);
      color: var(--color-text);
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 700;
      cursor: pointer;
      transition: background var(--ease-brutal);
    }

    .btn-cancel:hover {
      background: var(--color-bg);
    }

    .empty {
      grid-column: 1 / -1;
      padding: var(--space-3xl) 0;
    }

    .empty p {
      color: var(--color-text-3);
      font-size: var(--text-lg);
      margin: 0;
      max-width: 32ch;
      font-family: var(--font-mono);
    }
  `;

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    await this.loadBoards();
    this._pollTimer = setInterval(() => {
      this.activityEvents = activityStore.getAll();
    }, 2000);
    window.addEventListener("create-board", this._openCreateForm);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
    window.removeEventListener("create-board", this._openCreateForm);
  }

  private async loadBoards(): Promise<void> {
    this.boards = await listBoards.execute();
  }

  private getCardColor(index: number): string {
    return BENTO_COLORS[index % BENTO_COLORS.length];
  }

  private async handleCreate(): Promise<void> {
    if (!this.newTitle.trim()) return;
    const id = await createBoard.execute({
      title: this.newTitle.trim(),
      description: this.newDescription.trim() || undefined,
    });
    this.newTitle = "";
    this.newDescription = "";
    this.showCreateForm = false;
    this.pageController.navigate("board-detail", { id });
  }

  private async handleDelete(board: Board): Promise<void> {
    if (
      !confirm(
        `Delete "${board.title}"? All states, tasks, and images will be permanently removed.`,
      )
    ) return;
    try {
      await deleteBoard.execute(board.id);
      await this.loadBoards();
    } catch (e) {
      console.error(e);
    }
  }

  private navigateToBoard(id: string): void {
    this.pageController.navigate("board-detail", { id });
  }

  private _groupEventsByType(): {
    added: ActivityEvent[];
    updated: ActivityEvent[];
    done: ActivityEvent[];
  } {
    const added = this.activityEvents.filter((e) => e.type === "created").slice(
      0,
      5,
    );
    const updated = this.activityEvents.filter((e) =>
      e.type === "updated" || e.type === "moved" || e.type === "commented"
    ).slice(0, 5);
    const done = this.activityEvents.filter((e) => e.type === "completed")
      .slice(0, 5);
    return { added, updated, done };
  }

  render() {
    const { added, updated, done } = this._groupEventsByType();

    return html`
      <h1 class="page-title">
        Home
        <span class="count">${this.activityEvents.length}</span>
      </h1>

      <div class="activity-section">
        <h2 class="activity-section-title">Activity</h2>
        <div class="activity-columns">
          <div class="activity-col">
            <div class="activity-col-header added">Added</div>
            <div class="activity-col-body">
              ${added.length === 0
                ? html`
                  <div
                    style="font-family:var(--font-mono);font-size:var(--text-xs);color:var(--color-text-3);padding:var(--space-md);">No new items</div>
                `
                : ""}
              ${added.map((ev) =>
                html`
                  <div class="activity-item">
                    <span class="activity-icon created">+</span>
                    <div class="activity-info">
                      <div class="activity-label">${ev.label}</div>
                      <div class="activity-time">${new Date(ev.timestamp)
                        .toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}</div>
                    </div>
                  </div>
                `
              )}
            </div>
          </div>

          <div class="activity-col">
            <div class="activity-col-header updated">Updated</div>
            <div class="activity-col-body">
              ${updated.length === 0
                ? html`
                  <div
                    style="font-family:var(--font-mono);font-size:var(--text-xs);color:var(--color-text-3);padding:var(--space-md);">No updates</div>
                `
                : ""}
              ${updated.map((ev) =>
                html`
                  <div class="activity-item">
                    <span class="activity-icon ${ev.type === "commented"
                      ? "commented"
                      : "updated"}">${ev.type === "commented"
                      ? "💬"
                      : ev.type === "moved"
                      ? "→"
                      : "✎"}</span>
                    <div class="activity-info">
                      <div class="activity-label">${ev.label}</div>
                      <div class="activity-time">${new Date(ev.timestamp)
                        .toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}</div>
                    </div>
                  </div>
                `
              )}
            </div>
          </div>

          <div class="activity-col">
            <div class="activity-col-header done">Done</div>
            <div class="activity-col-body">
              ${done.length === 0
                ? html`
                  <div
                    style="font-family:var(--font-mono);font-size:var(--text-xs);color:var(--color-text-3);padding:var(--space-md);">Nothing done yet</div>
                `
                : ""}
              ${done.map((ev) =>
                html`
                  <div class="activity-item">
                    <span class="activity-icon completed">✓</span>
                    <div class="activity-info">
                      <div class="activity-label">${ev.label}</div>
                      <div class="activity-time">${new Date(ev.timestamp)
                        .toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}</div>
                    </div>
                  </div>
                `
              )}
            </div>
          </div>
        </div>
      </div>

      <h2 class="activity-section-title" style="margin-top:var(--space-2xl);">
        Boards
        <span style="font-family:var(--font-mono);font-size:var(--text-base);border:3px solid var(--color-black);padding:2px var(--space-sm);margin-left:var(--space-sm);">${this
          .boards.length}</span>
      </h2>

      <div class="board-grid">
        ${this.boards.length === 0 && !this.showCreateForm
          ? html`
            <div class="board-card--new"
              @click="${() => {
                if (!this.showCreateForm) this.showCreateForm = true;
              }}">
              ${this.showCreateForm
                ? html`
                  <div class="create-form" @click="${(e: Event) =>
                    e.stopPropagation()}">
                    <input type="text" placeholder="Board title"
                      .value="${this.newTitle}"
                      @input="${(e: Event) =>
                        this.newTitle = (e.target as HTMLInputElement).value}"
                      @keydown="${(e: KeyboardEvent) => {
                        if (e.key === "Enter") this.handleCreate();
                        if (e.key === "Escape") this.showCreateForm = false;
                      }}"
                    />
                    <textarea placeholder="Description (optional)"
                      .value="${this.newDescription}"
                      @input="${(e: Event) =>
                        this.newDescription =
                          (e.target as HTMLTextAreaElement).value}"
                    ></textarea>
                    <div class="form-actions">
                      <button class="btn-create" @click="${this
                        .handleCreate}">Create</button>
                      <button class="btn-cancel" @click="${() =>
                        this.showCreateForm = false}">Cancel</button>
                    </div>
                  </div>
                `
                : html`
                  <span class="new-icon">+</span>
                  <span class="new-label">New board</span>
                  <keycap-el key="B"></keycap-el>
                `}
            </div>
          `
          : html`
            ${this.boards.map((board, i) => {
              const color = this.getCardColor(i);
              return html`
                <div class="board-card"
                  @click="${() => this.navigateToBoard(board.id)}">
                  <div class="color-strip" style="background:${color}"></div>
                  <button class="card-delete-btn"
                    @click="${(e: Event) => {
                      e.stopPropagation();
                      this.handleDelete(board);
                    }}"
                    title="Delete board">✕</button>
                  <h3>${board.title}</h3>
                  ${board.description ? html`<p>${board.description}</p>` : ""}
                  <div class="card-meta">
                    <span>#${(i + 1).toString().padStart(2, "0")}</span>
                    <span>${new Date(board.createdAt)
                      .toLocaleDateString()}</span>
                  </div>
                </div>
              `;
            })}

            <div class="board-card--new"
              @click="${() => {
                if (!this.showCreateForm) this.showCreateForm = true;
              }}">
              ${this.showCreateForm
                ? html`
                  <div class="create-form" @click="${(e: Event) =>
                    e.stopPropagation()}">
                    <input type="text" placeholder="Board title"
                      .value="${this.newTitle}"
                      @input="${(e: Event) =>
                        this.newTitle = (e.target as HTMLInputElement).value}"
                      @keydown="${(e: KeyboardEvent) => {
                        if (e.key === "Enter") this.handleCreate();
                        if (e.key === "Escape") this.showCreateForm = false;
                      }}"
                    />
                    <textarea placeholder="Description (optional)"
                      .value="${this.newDescription}"
                      @input="${(e: Event) =>
                        this.newDescription =
                          (e.target as HTMLTextAreaElement).value}"
                    ></textarea>
                    <div class="form-actions">
                      <button class="btn-create" @click="${this
                        .handleCreate}">Create</button>
                      <button class="btn-cancel" @click="${() =>
                        this.showCreateForm = false}">Cancel</button>
                    </div>
                  </div>
                `
                : html`
                  <span class="new-icon">+</span>
                  <span class="new-label">New board</span>
                  <keycap-el key="B"></keycap-el>
                `}
            </div>
          `}
      </div>
    `;
  }
}
