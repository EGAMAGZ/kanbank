import { css, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import { ElementController } from "@open-cells/element-controller";
import { DexieBoardRepository } from "../../infrastructure/repositories/dexie-board.repository.js";
import { ListBoardsUseCase } from "../../application/use-cases/boards/list-boards.js";
import type { Board } from "../../domain/entities/board.entity.js";

const boardRepo = new DexieBoardRepository();
const listBoards = new ListBoardsUseCase(boardRepo);

interface JumpResult {
  type: "section" | "board" | "tag" | "action";
  label: string;
  detail: string;
  action: () => void;
  key?: string;
}

@customElement("jump-menu")
export class JumpMenu extends LitElement {
  elementController = new ElementController(this);

  @state()
  private query = "";

  @state()
  private results: JumpResult[] = [];

  @state()
  private selectedIndex = 0;

  @state()
  private boards: Board[] = [];

  static styles = css`
    :host {
      position: fixed;
      inset: 0;
      z-index: 10000;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 12vh;
      background: rgba(0, 0, 0, 0.85);
    }

    .jump-container {
      width: 560px;
      max-width: 92vw;
      max-height: 70vh;
      display: flex;
      flex-direction: column;
      border: 4px solid var(--color-black);
      box-shadow: 10px 10px 0 var(--color-black);
      background: var(--color-white);
    }

    .jump-input-wrap {
      display: flex;
      align-items: center;
      border-bottom: 4px solid var(--color-black);
      padding: var(--space-lg);
      background: var(--color-black);
    }

    .jump-prompt {
      font-family: var(--font-mono);
      font-size: var(--text-lg);
      font-weight: 700;
      color: var(--color-success);
      margin-right: var(--space-md);
    }

    .jump-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-family: var(--font-mono);
      font-size: var(--text-xl);
      color: var(--color-white);
      caret-color: var(--color-success);
    }

    .jump-input::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }

    .jump-cursor {
      display: inline-block;
      width: 2px;
      height: 1.2em;
      background: var(--color-success);
      animation: blink 1s step-end infinite;
      margin-left: 2px;
    }

    @keyframes blink {
      50% {
        opacity: 0;
      }
    }

    .jump-body {
      flex: 1;
      overflow-y: auto;
    }

    .jump-empty {
      padding: var(--space-xl);
      text-align: center;
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      color: var(--color-text-3);
    }

    .jump-quick-access {
      display: flex;
      gap: var(--space-sm);
      padding: var(--space-md);
      border-bottom: 4px solid var(--color-black);
      background: var(--color-bg);
    }

    .jump-quick-btn {
      flex: 1;
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-md);
      border: 3px solid var(--color-black);
      background: var(--color-white);
      cursor: pointer;
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      font-weight: 700;
      transition: background var(--ease-brutal), transform var(--ease-brutal);
      box-shadow: 4px 4px 0 var(--color-black);
      text-align: left;
      position: relative;
    }

    .jump-quick-btn:hover {
      transform: translate(1px, 1px);
      box-shadow: 3px 3px 0 var(--color-black);
      background: var(--color-bg);
    }

    .jump-quick-btn:active {
      transform: translate(4px, 4px);
      box-shadow: 0 0 0 var(--color-black);
    }

    .jump-quick-key {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      border: 2px solid var(--color-black);
      background: var(--color-black);
      color: var(--color-white);
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 700;
      padding: 0 2px;
      flex-shrink: 0;
    }

    .jump-quick-label {
      flex: 1;
    }

    .jump-section-header {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-sm) var(--space-md);
      background: var(--color-white);
      border-bottom: 4px solid var(--color-black);
    }

    .jump-section-header .section-line {
      flex: 1;
      height: 4px;
      background: var(--color-black);
    }

    .jump-section-header .section-label {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      font-weight: 700;
      color: var(--color-text-2);
      text-transform: uppercase;
      letter-spacing: 1px;
      white-space: nowrap;
    }

    .jump-result {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      padding: var(--space-md);
      cursor: pointer;
      border-bottom: 2px solid var(--color-black);
      transition: background var(--ease-brutal);
    }

    .jump-result.selected {
      background: var(--color-accent);
      color: var(--color-white);
    }

    .jump-result:hover {
      background: var(--color-bg);
    }

    .jump-result.selected:hover {
      background: var(--color-accent);
    }

    .jump-type-badge {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      font-weight: 700;
      border: 2px solid var(--color-black);
      padding: 1px var(--space-xs);
      background: var(--color-white);
      flex-shrink: 0;
    }

    .jump-result.selected .jump-type-badge {
      background: var(--color-white);
      color: var(--color-text);
    }

    .jump-label {
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 600;
      flex: 1;
    }

    .jump-detail {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-3);
    }

    .jump-result.selected .jump-detail {
      color: rgba(255, 255, 255, 0.7);
    }

    .jump-hints {
      padding: var(--space-sm) var(--space-md);
      border-top: 4px solid var(--color-black);
      display: flex;
      gap: var(--space-md);
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-3);
      background: var(--color-bg);
      flex-wrap: wrap;
    }

    .jump-hints kbd {
      border: 2px solid var(--color-black);
      padding: 0 var(--space-xs);
      font-weight: 700;
      background: var(--color-white);
    }
  `;

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    this.boards = await listBoards.execute();
    this._updateResults();
    await this.updateComplete;
    const input = this.renderRoot.querySelector(
      ".jump-input",
    ) as HTMLInputElement;
    if (input) input.focus();
  }

  private _close(): void {
    this.dispatchEvent(
      new CustomEvent("jump-close", { bubbles: true, composed: true }),
    );
    this.remove();
  }

  private _onInput(e: InputEvent): void {
    this.query = (e.target as HTMLInputElement).value;
    this.selectedIndex = 0;
    this._updateResults();
  }

  private _updateResults(): void {
    const q = this.query.toLowerCase().trim();
    const results: JumpResult[] = [];

    if (!q) {
      results.push({
        type: "action",
        label: "Home",
        detail: "Activity feed",
        key: "1",
        action: () => {
          this.elementController.navigate("home");
          this._close();
        },
      });
      results.push({
        type: "action",
        label: "Create Board",
        detail: "New kanban board",
        key: "2",
        action: () => {
          this.elementController.navigate("home");
          this._close();
        },
      });
      results.push({
        type: "action",
        label: "Create Task",
        detail: "New task in Maybe?",
        key: "3",
        action: () => {
          window.dispatchEvent(new CustomEvent("create-task"));
          this._close();
        },
      });

      if (this.boards.length > 0) {
        results.push({
          type: "section",
          label: "Boards",
          detail: "",
          action: () => {},
        });
        for (const b of this.boards) {
          results.push({
            type: "board",
            label: b.title,
            detail: b.description || "No description",
            action: () => {
              this.elementController.navigate("board-detail", { id: b.id });
              this._close();
            },
          });
        }
      }

      results.push({
        type: "section",
        label: "Settings",
        detail: "",
        action: () => {},
      });
      results.push({
        type: "action",
        label: "Board Settings",
        detail: "Configure auto-close",
        action: () => {
          this.elementController.navigate("settings");
          this._close();
        },
      });
    } else {
      const boardResults = this.boards
        .filter((b) => b.title.toLowerCase().includes(q))
        .map((b) => ({
          type: "board" as const,
          label: b.title,
          detail: "Go to board",
          action: () => {
            this.elementController.navigate("board-detail", { id: b.id });
            this._close();
          },
        }));
      results.push(...boardResults);

      if (results.length === 0) {
        results.push({
          type: "action",
          label: `No results for "${this.query}"`,
          detail: "Try a different search",
          action: () => {},
        });
      }
    }

    this.results = results;
  }

  private get _regularResults(): JumpResult[] {
    return this.results.filter((r) => !r.key);
  }

  private _handleKeydown(e: KeyboardEvent): void {
    if (e.key === "Escape") {
      this._close();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const max = this._regularResults.length - 1;
      this.selectedIndex = Math.min(this.selectedIndex + 1, max);
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
      const result = this._regularResults[this.selectedIndex];
      if (result && result.type !== "section") result.action();
      return;
    }

    if (e.key === "1" || e.key === "2" || e.key === "3") {
      e.preventDefault();
      const action = this.results.find((r) => r.key === e.key);
      if (action) action.action();
    }
  }

  private _scrollIntoView(): void {
    const el = this.renderRoot.querySelector(
      ".jump-result.selected",
    ) as HTMLElement;
    if (el) el.scrollIntoView({ block: "nearest" });
  }

  private _onBackdropClick(e: MouseEvent): void {
    if (!(e.target as HTMLElement).closest(".jump-container")) {
      this._close();
    }
  }

  render() {
    const quickActions = this.results.filter((r) => r.key);
    const regularResults = this.results.filter((r) => !r.key);

    return html`
      <div @click="${this._onBackdropClick}">
        <div class="jump-container" @click="${(e: Event) =>
          e.stopPropagation()}">
          <div class="jump-input-wrap">
            <span class="jump-prompt">⌂</span>
            <input
              class="jump-input"
              type="text"
              placeholder="Search boards, people, tags..."
              .value="${this.query}"
              @input="${this._onInput}"
              @keydown="${this._handleKeydown}"
            />
          </div>

          ${!this.query
            ? html`
              <div class="jump-quick-access">
                ${quickActions.map((r) =>
                  html`
                    <button class="jump-quick-btn" @click="${r.action}">
                      <span class="jump-quick-key">${r.key}</span>
                      <span class="jump-quick-label">${r.label}</span>
                    </button>
                  `
                )}
              </div>
            `
            : ""}

          <div class="jump-body">
            ${regularResults.length === 0
              ? html`<div class="jump-empty">No results</div>`
              : regularResults.map((r, i) => {
                if (r.type === "section") {
                  return html`
                    <div class="jump-section-header">
                      <span class="section-label">${r.label}</span>
                      <div class="section-line"></div>
                    </div>
                  `;
                }
                const actualIndex = i;
                return html`
                  <div
                    class="jump-result ${actualIndex === this.selectedIndex
                      ? "selected"
                      : ""}"
                    @click="${r.action}"
                    @mouseenter="${() => {
                      this.selectedIndex = actualIndex;
                    }}"
                  >
                    <span class="jump-type-badge">${r.type === "board"
                      ? "B"
                      : ">"}</span>
                    <span class="jump-label">${r.label}</span>
                    <span class="jump-detail">${r.detail}</span>
                  </div>
                `;
              })}
          </div>

          <div class="jump-hints">
            <span><kbd>↑</kbd> <kbd>↓</kbd> navigate</span>
            <span><kbd>↵</kbd> select</span>
            <span><kbd>1-3</kbd> quick access</span>
            <span><kbd>Esc</kbd> close</span>
          </div>
        </div>
      </div>
    `;
  }
}
