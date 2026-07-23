import { html, LitElement, css } from 'lit';
import { PageController } from '@open-cells/page-controller';
import { customElement, state } from 'lit/decorators.js';
import { ListBoardsUseCase } from '../../application/use-cases/boards/list-boards.js';
import { CreateBoardUseCase } from '../../application/use-cases/boards/create-board.js';
import { DexieBoardRepository } from '../../infrastructure/repositories/dexie-board.repository.js';
import { DexieStateRepository } from '../../infrastructure/repositories/dexie-state.repository.js';
import type { Board } from '../../domain/entities/board.entity.js';

const boardRepo = new DexieBoardRepository();
const stateRepo = new DexieStateRepository();
const listBoards = new ListBoardsUseCase(boardRepo);
const createBoard = new CreateBoardUseCase(boardRepo, stateRepo);

@customElement('board-list-page')
export class BoardListPage extends LitElement {
  pageController = new PageController(this);

  @state() private boards: Board[] = [];
  @state() private showCreateForm = false;
  @state() private newTitle = '';
  @state() private newDescription = '';

  static styles = css`
    :host { display: block; padding: 24px; }
    h1 { margin: 0 0 24px; }
    .board-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .board-card {
      border: 1px solid #ddd; border-radius: 8px; padding: 16px; cursor: pointer;
      transition: box-shadow 0.2s;
    }
    .board-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .board-card h3 { margin: 0 0 8px; }
    .board-card p { margin: 0; color: #666; font-size: 14px; }
    .create-form { margin-top: 16px; padding: 16px; border: 1px solid #ddd; border-radius: 8px; }
    .create-form input, .create-form textarea { display: block; width: 100%; margin-bottom: 8px; padding: 8px; }
    .btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background: #0066cc; color: white; }
    .btn-secondary { background: #666; }
    .empty { color: #999; text-align: center; padding: 48px; }
  `;

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

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
    this.newTitle = '';
    this.newDescription = '';
    this.showCreateForm = false;
    this.pageController.navigate('board-detail', { id });
  }

  private navigateToBoard(id: string): void {
    this.pageController.navigate('board-detail', { id });
  }

  render() {
    return html`
      <h1>Boards</h1>
      <button class="btn" @click="${() => this.showCreateForm = !this.showCreateForm}">
        ${this.showCreateForm ? 'Cancel' : 'New Board'}
      </button>

      ${this.showCreateForm ? html`
        <div class="create-form">
          <input
            type="text"
            placeholder="Board title"
            .value="${this.newTitle}"
            @input="${(e: Event) => this.newTitle = (e.target as HTMLInputElement).value}"
          />
          <textarea
            placeholder="Description (optional)"
            .value="${this.newDescription}"
            @input="${(e: Event) => this.newDescription = (e.target as HTMLTextAreaElement).value}"
          ></textarea>
          <button class="btn" @click="${this.handleCreate}">Create</button>
        </div>
      ` : ''}

      ${this.boards.length === 0 ? html`
        <div class="empty">No boards yet. Create one to get started.</div>
      ` : html`
        <div class="board-list">
          ${this.boards.map(board => html`
            <div class="board-card" @click="${() => this.navigateToBoard(board.id)}">
              <h3>${board.title}</h3>
              ${board.description ? html`<p>${board.description}</p>` : ''}
            </div>
          `)}
        </div>
      `}
    `;
  }
}
