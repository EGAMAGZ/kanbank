import { css, html, LitElement } from "lit";
import { PageController } from "@open-cells/page-controller";
import { customElement, state } from "lit/decorators.js";
import { ListBoardsUseCase } from "../../application/use-cases/boards/list-boards.js";
import { CreateBoardUseCase } from "../../application/use-cases/boards/create-board.js";
import { DexieBoardRepository } from "../../infrastructure/repositories/dexie-board.repository.js";
import { DexieStateRepository } from "../../infrastructure/repositories/dexie-state.repository.js";
import type { Board } from "../../domain/entities/board.entity.js";

const boardRepo = new DexieBoardRepository();
const stateRepo = new DexieStateRepository();
const listBoards = new ListBoardsUseCase(boardRepo);
const createBoard = new CreateBoardUseCase(boardRepo, stateRepo);

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

    /* Title — breaks the grid, floats in whitespace */
    .page-title {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: var(--text-5xl);
      letter-spacing: -0.04em;
      line-height: var(--leading-tight);
      margin-bottom: var(--space-3xl);
      max-width: 14ch;
    }

    /* New board button — brutal anchor, the single raw gesture */
    .new-board-btn {
      display: inline-block;
      padding: var(--space-sm) var(--space-md);
      border: 2px solid var(--color-black);
      box-shadow: var(--shadow-brutal);
      background: var(--color-accent);
      color: var(--color-white);
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 700;
      cursor: pointer;
      transition: transform var(--ease-brutal), box-shadow var(--ease-brutal);
      margin-bottom: var(--space-2xl);
    }

    .new-board-btn:hover {
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0 var(--color-black);
    }

    .new-board-btn:active {
      transform: translate(4px, 4px);
      box-shadow: 0 0 0 var(--color-black);
    }

    /* Bento grid — generous gutters, asymmetric */
    .board-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: var(--gutter);
      align-items: start;
    }

    /* Anchor card — the ONE brutal container */
    .board-item-anchor {
      grid-column: span 5;
      border: 2px solid var(--color-black);
      box-shadow: var(--shadow-brutal-md);
      padding: var(--space-xl);
      cursor: pointer;
      background: var(--color-white);
      transition: transform var(--ease-brutal), box-shadow var(--ease-brutal);
    }

    .board-item-anchor:hover {
      transform: translate(3px, 3px);
      box-shadow: 3px 3px 0 var(--color-black);
    }

    .board-item-anchor:active {
      transform: translate(6px, 6px);
      box-shadow: 0 0 0 var(--color-black);
    }

    .board-item-anchor h3 {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: var(--text-2xl);
      letter-spacing: -0.03em;
      margin-bottom: var(--space-md);
      line-height: var(--leading-snug);
    }

    .board-item-anchor p {
      margin: 0;
      color: var(--color-text-2);
      font-size: var(--text-base);
      line-height: var(--leading-normal);
    }

    /* Minimal board — typography only, no container */
    .board-item-minimal {
      grid-column: span 3;
      padding: var(--space-sm) 0;
      cursor: pointer;
    }

    .board-item-minimal h3 {
      font-family: var(--font-display);
      font-weight: 700;
      font-size: var(--text-lg);
      letter-spacing: -0.02em;
      margin: 0 0 var(--space-xs);
      transition: color var(--ease-brutal);
    }

    .board-item-minimal:hover h3 {
      color: var(--color-accent);
    }

    .board-item-minimal p {
      margin: 0;
      color: var(--color-text-3);
      font-size: var(--text-sm);
      line-height: var(--leading-normal);
    }

    /* Create form — dashed border, no shadow */
    .create-form {
      grid-column: span 4;
      padding: var(--space-lg);
      border: 2px dashed var(--color-border);
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

  private navigateToBoard(id: string): void {
    this.pageController.navigate("board-detail", { id });
  }

  render() {
    return html`
      <h1 class="page-title">Boards</h1>

      <button class="new-board-btn" @click="${() =>
        this.showCreateForm = !this.showCreateForm}">
        ${this.showCreateForm ? "Cancel" : "New board"}
      </button>

      <div class="board-grid">
        ${this.showCreateForm
          ? html`
            <div class="create-form">
              <input
                type="text"
                placeholder="Board title"
                .value="${this.newTitle}"
                @input="${(e: Event) =>
                  this.newTitle = (e.target as HTMLInputElement).value}"
              />
              <textarea
                placeholder="Description (optional)"
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
          : ""}

        ${this.boards.length === 0 && !this.showCreateForm
          ? html`
            <div class="empty">
              <p>No boards yet. Create one to get started.</p>
            </div>
          `
          : this.boards.map((board, i) => {
            if (i === 0) {
              return html`
                <div class="board-item-anchor" @click="${() =>
                  this.navigateToBoard(board.id)}">
                  <h3>${board.title}</h3>
                  ${board.description ? html`<p>${board.description}</p>` : ""}
                </div>
              `;
            }
            return html`
              <div class="board-item-minimal" @click="${() =>
                this.navigateToBoard(board.id)}">
                <h3>${board.title}</h3>
                ${board.description ? html`<p>${board.description}</p>` : ""}
              </div>
            `;
          })}
      </div>
    `;
  }
}
