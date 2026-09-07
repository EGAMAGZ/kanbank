import { css, html, LitElement } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { customElement, state } from "lit/decorators.js";
import { ElementController } from "@open-cells/element-controller";
import { DexieBoardRepository } from "../../infrastructure/repositories/dexie-board.repository.js";
import { DexieTaskRepository } from "../../infrastructure/repositories/dexie-task.repository.js";
import { ListBoardsUseCase } from "../../application/use-cases/boards/list-boards.js";
import type { Board } from "../../domain/entities/board.entity.js";
import type { Task } from "../../domain/entities/task.entity.js";

const boardRepo = new DexieBoardRepository();
const taskRepo = new DexieTaskRepository();
const listBoards = new ListBoardsUseCase(boardRepo);

interface CmdResult {
  type: "board" | "action";
  label: string;
  detail: string;
  action: () => void;
}

@customElement("command-bar")
export class CommandBar extends LitElement {
  elementController = new ElementController(this);

  @state()
  private query = "";

  @state()
  private results: CmdResult[] = [];

  @state()
  private selectedIndex = 0;

  @state()
  private boards: Board[] = [];

  @state()
  private tasks: Task[] = [];

  static styles = css`
    :host {
      position: fixed;
      inset: 0;
      z-index: 10000;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 15vh;
      background: rgba(0, 0, 0, 0.8);
    }

    .cmd-container {
      width: 520px;
      max-width: 90vw;
      max-height: 60vh;
      display: flex;
      flex-direction: column;
      border: var(--line-thicker) solid var(--color-black);
      box-shadow: var(--shadow-brutal-xl);
      background: var(--color-white);
    }

    .cmd-input-wrap {
      display: flex;
      align-items: center;
      border-bottom: var(--line-thick) solid var(--color-black);
      padding: var(--space-md);
      background: var(--color-black);
    }

    .cmd-prompt {
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      font-weight: 700;
      color: var(--color-success);
      margin-right: var(--space-sm);
    }

    .cmd-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-family: var(--font-mono);
      font-size: var(--text-base);
      color: var(--color-white);
      caret-color: var(--color-success);
    }

    .cmd-input::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }

    .cmd-results {
      flex: 1;
      overflow-y: auto;
      background: var(--color-white);
    }

    .cmd-empty {
      padding: var(--space-xl);
      text-align: center;
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      color: var(--color-text-3);
    }

    .cmd-result {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      padding: var(--space-md);
      cursor: pointer;
      border-bottom: 2px solid var(--color-black);
      transition: background var(--ease-brutal);
    }

    .cmd-result.selected {
      background: var(--color-accent);
      color: var(--color-white);
    }

    .cmd-result:hover {
      background: var(--color-bg);
    }

    .cmd-result.selected:hover {
      background: var(--color-accent);
    }

    .cmd-type-badge {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      font-weight: 700;
      border: 2px solid var(--color-black);
      padding: 1px var(--space-xs);
      background: var(--color-white);
      flex-shrink: 0;
    }

    .cmd-result.selected .cmd-type-badge {
      background: var(--color-white);
      color: var(--color-text);
    }

    .cmd-label {
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 600;
      flex: 1;
    }

    .cmd-detail {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-3);
    }

    .cmd-result.selected .cmd-detail {
      color: rgba(255, 255, 255, 0.7);
    }

    .cmd-hints {
      padding: var(--space-sm) var(--space-md);
      border-top: var(--line-thick) solid var(--color-black);
      display: flex;
      gap: var(--space-md);
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-3);
      background: var(--color-bg);
    }

    .cmd-hints kbd {
      border: 2px solid var(--color-black);
      padding: 0 var(--space-xs);
      font-weight: 700;
      background: var(--color-white);
    }
  `;

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    this.boards = await listBoards.execute();
    this.tasks = await taskRepo.findAll();
    this._updateResults();
    // Focus input after render
    await this.updateComplete;
    const input = this.renderRoot.querySelector(
      ".cmd-input",
    ) as HTMLInputElement;
    if (input) input.focus();
  }

  private _close(): void {
    this.remove();
  }

  private _onInput(e: InputEvent): void {
    this.query = (e.target as HTMLInputElement).value;
    this.selectedIndex = 0;
    this._updateResults();
  }

  private _updateResults(): void {
    const q = this.query.toLowerCase().trim();
    const results: CmdResult[] = [];

    if (!q) {
      results.push({
        type: "action",
        label: "Assigned to me",
        detail: "View tasks assigned to you",
        action: () => {},
      });
      results.push({
        type: "action",
        label: "Settings",
        detail: "Open board settings",
        action: () => {
          this.elementController.navigate("settings");
          this._close();
        },
      });
      return;
    }

    const boardResults: CmdResult[] = this.boards
      .filter((b) => b.title.toLowerCase().includes(q))
      .map((b) => ({
        type: "board" as const,
        label: b.title,
        detail: `Go to board`,
        action: () => {
          this.elementController.navigate("board-detail", { id: b.id });
          this._close();
        },
      }));

    const taskResults: CmdResult[] = this.tasks
      .filter((task) => {
        const searchable = `${task.title} ${task.description ?? ""}`.toLowerCase();
        return searchable.includes(q);
      })
      .map((task) => {
        const boardTitle = this.boards.find((b) => b.id === task.boardId)?.title;
        return {
          type: "action" as const,
          label: task.title,
          detail: boardTitle ? `Open task in ${boardTitle}` : "Open task",
          action: () => {
            this.elementController.navigate("task-detail", { id: task.id });
            this._close();
          },
        };
      });

    results.push(...boardResults, ...taskResults);

    if (results.length === 0) {
      results.push({
        type: "action",
        label: `No results for "${this.query}"`,
        detail: "Try a different search",
        action: () => {},
      });
    }

    this.results = results;
  }

  private _handleKeydown(e: KeyboardEvent): void {
    if (e.key === "Escape") {
      this._close();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      this.selectedIndex = Math.min(
        this.selectedIndex + 1,
        this.results.length - 1,
      );
      this._scrollIntoView();
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
      this._scrollIntoView();
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const result = this.results[this.selectedIndex];
      if (result) result.action();
      return;
    }
  }

  private _scrollIntoView(): void {
    const el = this.renderRoot.querySelector(
      ".cmd-result.selected",
    ) as HTMLElement;
    if (el) el.scrollIntoView({ block: "nearest" });
  }

  private _onBackdropClick(e: MouseEvent): void {
    if (!(e.target as HTMLElement).closest(".cmd-container")) {
      this._close();
    }
  }

  render() {
    return html`
      <div @click="${this._onBackdropClick}">
        <div class="cmd-container" @click="${(e: Event) =>
          e.stopPropagation()}">
          <div class="cmd-input-wrap">
            <span class="cmd-prompt">$</span>
            <input
              class="cmd-input"
              type="text"
              placeholder="Search boards, people, tags..."
              .value="${this.query}"
              @input="${this._onInput}"
              @keydown="${this._handleKeydown}"
            />
          </div>
          <div class="cmd-results">
            ${this.results.length === 0
              ? html`<div class="cmd-empty">No results</div>`
              : this.results.map(
                (r, i) =>
                  html`
                    <div
                      class=${classMap({
                      "cmd-result": true,
                      selected: i === this.selectedIndex,
                    })}
                      @click="${r.action}"
                      @mouseenter="${() => {
                        this.selectedIndex = i;
                      }}"
                    >
                      <span class="cmd-type-badge">${r.type === "board"
                        ? "B"
                        : ">"}</span>
                      <span class="cmd-label">${r.label}</span>
                      <span class="cmd-detail">${r.detail}</span>
                    </div>
                  `,
              )}
          </div>
          <div class="cmd-hints">
            <span><kbd>↑</kbd> <kbd>↓</kbd> navigate</span>
            <span><kbd>↵</kbd> select</span>
            <span><kbd>Esc</kbd> close</span>
          </div>
        </div>
      </div>
    `;
  }
}
