import { css, html, LitElement } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { PageController } from "@open-cells/page-controller";
import { customElement, state } from "lit/decorators.js";
import { DexieBoardRepository } from "../../infrastructure/repositories/dexie-board.repository.js";
import { ListBoardsUseCase } from "../../application/use-cases/boards/list-boards.js";
import { UpdateBoardUseCase } from "../../application/use-cases/boards/update-board.js";
import type { Board } from "../../domain/entities/board.entity.js";
import type { Id } from "../../shared/types/id.js";
import "../../ui/components/auto-close-dial.js";

const boardRepo = new DexieBoardRepository();
const listBoards = new ListBoardsUseCase(boardRepo);
const updateBoard = new UpdateBoardUseCase(boardRepo);

@customElement("settings-page")
export class SettingsPage extends LitElement {
  pageController = new PageController(this);

  @state()
  private boards: Board[] = [];
  @state()
  private selectedBoardId: string | null = null;
  @state()
  private selectedBoard: Board | null = null;

  @state()
  private autoCloseDays = 7;
  @state()
  private autoCloseEnabled = false;
  static styles = css`
    :host {
      display: block;
      padding: var(--space-2xl) var(--gutter-lg);
      max-width: 720px;
      margin: 0 auto;
      overflow-y: auto;
      height: 100%;
    }

    .page-title {
      font-family: var(--font-display);
      font-weight: 900;
      font-size: var(--text-3xl);
      letter-spacing: -0.04em;
      margin-bottom: var(--space-2xl);
      border-bottom: var(--line-thicker) solid var(--color-black);
      padding-bottom: var(--space-md);
    }

    .section {
      border: var(--line-thicker) solid var(--color-black);
      box-shadow: 6px 6px 0 var(--color-black);
      background: var(--color-white);
      padding: var(--space-xl);
      margin-bottom: var(--space-xl);
    }

    .section-title {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: var(--text-xl);
      letter-spacing: -0.02em;
      margin: 0 0 var(--space-lg);
      border-bottom: var(--line-thick) solid var(--color-black);
      padding-bottom: var(--space-sm);
    }

    .section p {
      color: var(--color-text-2);
      font-size: var(--text-sm);
      margin: 0 0 var(--space-lg);
      line-height: var(--leading-normal);
      font-family: var(--font-mono);
    }

    .board-select {
      width: 100%;
      padding: var(--space-sm) var(--space-md);
      border: 3px solid var(--color-black);
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      font-weight: 700;
      outline: none;
      margin-bottom: var(--space-lg);
    }

    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-md) 0;
      border-bottom: 2px solid var(--color-black);
    }

    .toggle-label {
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      font-weight: 700;
    }

    .toggle-switch {
      position: relative;
      width: 52px;
      height: 28px;
      border: 3px solid var(--color-black);
      background: var(--color-white);
      cursor: pointer;
      transition: background var(--ease-brutal);
    }

    .toggle-switch.active {
      background: var(--color-success);
    }

    .toggle-switch.danger.active {
      background: var(--color-error);
    }

    .toggle-knob {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 18px;
      height: 18px;
      background: var(--color-white);
      border: 2px solid var(--color-black);
      transition: left 0.15s ease-out;
    }

    .toggle-switch.active .toggle-knob {
      left: 28px;
    }

    .toggle-icon {
      font-size: 16px;
      margin-right: var(--space-xs);
    }

    .dial-wrap {
      display: flex;
      justify-content: center;
      padding: var(--space-lg) 0;
    }

    .btn-save {
      display: block;
      width: 100%;
      padding: var(--space-md);
      border: 3px solid var(--color-black);
      box-shadow: 5px 5px 0 var(--color-black);
      background: var(--color-accent);
      color: var(--color-white);
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      font-weight: 700;
      cursor: pointer;
      transition: transform var(--ease-brutal), box-shadow var(--ease-brutal);
    }

    .btn-save:hover {
      transform: translate(2px, 2px);
      box-shadow: 3px 3px 0 var(--color-black);
    }

    .btn-save:active {
      transform: translate(5px, 5px);
      box-shadow: 0 0 0 var(--color-black);
    }

    .status-msg {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-success);
      margin-top: var(--space-sm);
    }
  `;

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    this.boards = await listBoards.execute();
    if (this.boards.length > 0) {
      this.selectedBoardId = this.boards[0].id;
      this._loadBoardSettings(this.boards[0].id);
    }
  }

  private _loadBoardSettings(boardId: string): void {
    const board = this.boards.find((b) => b.id === boardId);
    if (board) {
      this.selectedBoard = board;
      this.autoCloseDays = board.autoCloseDays ?? 7;
      this.autoCloseEnabled = board.autoCloseEnabled ?? false;
    }
  }

  private _handleBoardSelect(e: Event): void {
    const id = (e.target as HTMLSelectElement).value;
    this.selectedBoardId = id;
    this._loadBoardSettings(id);
  }

  private _handleDialChange(e: CustomEvent): void {
    this.autoCloseDays = e.detail.value;
  }

  private async _saveSettings(): Promise<void> {
    if (!this.selectedBoardId) return;
    try {
      await updateBoard.execute(this.selectedBoardId as Id<"Board">, {
        autoCloseDays: this.autoCloseDays,
        autoCloseEnabled: this.autoCloseEnabled,
      });
      this.boards = await listBoards.execute();
      this.requestUpdate();
    } catch (e) {
      console.error(e);
    }
  }

  render() {
    return html`
      <h1 class="page-title">Board Settings</h1>

      <div class="section">
        <h2 class="section-title">Select Board</h2>
        <select class="board-select" @change="${this._handleBoardSelect}">
          ${this.boards.map((b) =>
            html`
              <option value="${b
                .id}" ?selected="${b.id === this.selectedBoardId}">${b
                .title}</option>
            `
          )}
        </select>
      </div>

      ${this.selectedBoard
        ? html`
          <div class="section">
            <h2 class="section-title">Auto-Close</h2>
            <p>Automatically move inactive tasks to "Not now" after a configured number of days.</p>

            <div class="toggle-row">
              <span class="toggle-label">Enable auto-close</span>
              <div class=${classMap({
                "toggle-switch": true,
                active: this.autoCloseEnabled,
              })}
                @click="${() => {
                  this.autoCloseEnabled = !this.autoCloseEnabled;
                }}">
                <div class="toggle-knob"></div>
              </div>
            </div>

            ${this.autoCloseEnabled
              ? html`
                <div class="dial-wrap">
                  <auto-close-dial .value="${this
                    .autoCloseDays}" .enabled="${this.autoCloseEnabled}"
                    @dial-change="${this._handleDialChange}"></auto-close-dial>
                </div>
              `
              : ""}

            <div style="margin-top:var(--space-md);">
              <button class="btn-save" @click="${this
                ._saveSettings}">SAVE SETTINGS</button>
            </div>
          </div>
        `
        : html`
          <div class="section">
            <p style="text-align:center;">No boards available. Create a board first.</p>
          </div>
        `}
    `;
  }
}
