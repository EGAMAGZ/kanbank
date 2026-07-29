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
import type { Board } from "../../domain/entities/board.entity.js";

const boardRepo = new DexieBoardRepository();
const stateRepo = new DexieStateRepository();
const taskRepo = new DexieTaskRepository();
const commentRepo = new DexieCommentRepository();
const imageRepo = new DexieImageRepository();
const listBoards = new ListBoardsUseCase(boardRepo);
const createBoard = new CreateBoardUseCase(boardRepo, stateRepo);
const deleteBoard = new DeleteBoardUseCase(
  boardRepo,
  stateRepo,
  taskRepo,
  commentRepo,
  imageRepo,
);

const BENTO_COLORS = [
  "#2563EB",
  "#D97706",
  "#059669",
  "#7C3AED",
  "#DC2626",
];

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

  static styles = css`
    :host {
      display: block;
      padding: var(--space-3xl) var(--gutter-lg) var(--space-2xl);
      max-width: var(--max-width);
      margin: 0 auto;
      overflow-y: auto;
    }

    .page-title {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: var(--text-5xl);
      letter-spacing: -0.04em;
      line-height: var(--leading-tight);
      margin-bottom: var(--space-3xl);
      max-width: 14ch;
    }

    .board-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: var(--gutter);
      align-items: start;
    }

    .bento-card {
      border: 2px solid var(--color-black);
      border-top: 3px solid var(--card-color, var(--color-accent));
      box-shadow: var(--shadow-brutal-md);
      padding: var(--space-xl);
      cursor: pointer;
      background: var(--color-white);
      transition: transform var(--ease-brutal), box-shadow var(--ease-brutal);
      position: relative;
    }

    .bento-card:hover {
      transform: translate(3px, 3px);
      box-shadow: 3px 3px 0 var(--color-black);
    }

    .bento-card:active {
      transform: translate(6px, 6px);
      box-shadow: 0 0 0 var(--color-black);
    }

    .bento-card h3 {
      margin: 0 0 var(--space-sm);
      font-family: var(--font-display);
      font-weight: 800;
      font-size: var(--text-xl);
      letter-spacing: -0.03em;
      line-height: var(--leading-snug);
    }

    .bento-card p {
      margin: 0;
      color: var(--color-text-2);
      font-size: var(--text-sm);
      line-height: var(--leading-normal);
    }

    .bento-card--new {
      border-style: dashed;
      box-shadow: none;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-sm);
      color: var(--color-text-2);
      cursor: pointer;
      min-height: 120px;
      transition: color var(--ease-brutal), border-color var(--ease-brutal);
    }

    .bento-card--new:hover {
      color: var(--color-accent);
      border-color: var(--color-accent);
      transform: none;
      box-shadow: none;
    }

    .bento-card--new:active {
      transform: none;
      box-shadow: none;
    }

    .bento-card--new .new-board-plus {
      font-size: var(--text-2xl);
      font-weight: 300;
      line-height: 1;
    }

    .bento-card--new .new-board-label {
      font-size: var(--text-base);
      font-weight: 600;
    }

    .card-delete-btn {
      position: absolute;
      top: var(--space-sm);
      right: var(--space-sm);
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: none;
      cursor: pointer;
      font-size: 15px;
      color: var(--color-text-3);
      transition: color var(--ease-brutal), background var(--ease-brutal);
      border: 2px solid transparent;
      opacity: 0;
    }

    .bento-card:hover .card-delete-btn {
      opacity: 1;
    }

    .card-delete-btn:hover {
      color: var(--color-error);
      background: var(--color-surface);
      border-color: var(--color-error);
    }

    .create-form {
      width: 100%;
    }

    .create-form input,
    .create-form textarea {
      display: block;
      width: 100%;
      padding: var(--space-sm) var(--space-md);
      border: 2px solid var(--color-black);
      font-family: var(--font-body);
      font-size: var(--text-sm);
      margin-bottom: var(--space-sm);
      outline: none;
      background: var(--color-white);
      transition: box-shadow var(--ease-brutal);
    }

    .create-form input:focus,
    .create-form textarea:focus {
      box-shadow: 2px 2px 0 var(--color-accent);
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
      border: 2px solid var(--color-black);
      box-shadow: 3px 3px 0 var(--color-black);
      background: var(--color-text);
      color: var(--color-white);
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 700;
      cursor: pointer;
      transition: transform var(--ease-brutal), box-shadow var(--ease-brutal);
    }

    .btn-create:hover {
      transform: translate(1px, 1px);
      box-shadow: 2px 2px 0 var(--color-black);
    }

    .btn-create:active {
      transform: translate(3px, 3px);
      box-shadow: 0 0 0 var(--color-black);
    }

    .btn-cancel {
      padding: var(--space-sm) var(--space-md);
      border: none;
      background: none;
      color: var(--color-text-2);
      font-family: var(--font-body);
      font-size: var(--text-sm);
      cursor: pointer;
    }

    .btn-cancel:hover {
      color: var(--color-text);
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
    }
  `;

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    await this.loadBoards();
  }

  private async loadBoards(): Promise<void> {
    this.boards = await listBoards.execute();
  }

  private getCardSpan(board: Board): number {
    const hasDesc = !!board.description;
    const len = board.title.length;
    if (hasDesc && len > 25) return 6;
    if (hasDesc) return 5;
    if (len > 28) return 5;
    if (len > 14) return 4;
    return 3;
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

  render() {
    return html`
      <h1 class="page-title">Boards</h1>

      <div class="board-grid">
        ${this.boards.length === 0 && !this.showCreateForm
          ? html`
            <div class="empty">
              <p>No boards yet. Create one to get started.</p>
            </div>
          `
          : html`
            ${this.boards.map((board, i) => {
              const span = this.getCardSpan(board);
              const color = this.getCardColor(i);
              return html`
                <div class="bento-card"
                  style="--card-color: ${color}; grid-column: span ${span}"
                  @click="${() => this.navigateToBoard(board.id)}">
                  <button class="card-delete-btn"
                    @click="${(e: Event) => {
                      e.stopPropagation();
                      this.handleDelete(board);
                    }}"
                    title="Delete board">&#128465;</button>
                  <h3>${board.title}</h3>
                  ${board.description
                    ? html`<p>${board.description}</p>`
                    : ""}
                </div>
              `;
            })}

            <div class="bento-card bento-card--new"
              style="grid-column: span 4"
              @click="${() => { if (!this.showCreateForm) this.showCreateForm = true; }}">
              ${this.showCreateForm
                ? html`
                  <div class="create-form" @click="${(e: Event) => e.stopPropagation()}">
                    <input
                      type="text"
                      placeholder="Board title"
                      .value="${this.newTitle}"
                      @input="${(e: Event) =>
                        this.newTitle = (e.target as HTMLInputElement).value}"
                      @keydown="${(e: KeyboardEvent) => {
                        if (e.key === "Enter") this.handleCreate();
                        if (e.key === "Escape") this.showCreateForm = false;
                      }}"
                    />
                    <textarea
                      placeholder="Description (optional)"
                      .value="${this.newDescription}"
                      @input="${(e: Event) =>
                        this.newDescription =
                          (e.target as HTMLTextAreaElement).value}"
                    ></textarea>
                    <div class="form-actions">
                      <button class="btn-create" @click="${this.handleCreate}">Create</button>
                      <button class="btn-cancel" @click="${() =>
                        this.showCreateForm = false}">Cancel</button>
                    </div>
                  </div>
                `
                : html`
                  <span class="new-board-plus">+</span>
                  <span class="new-board-label">New board</span>
                `}
            </div>
          `}
      </div>
    `;
  }
}
