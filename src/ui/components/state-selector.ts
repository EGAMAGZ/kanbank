import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { State } from "../../domain/entities/state.entity.js";

const COLUMN_COLORS: Record<string, string> = {
  "Not now": "#8C8C8C",
  "Maybe?": "#FFFFFF",
  "In Progress": "#1E40AF",
  "Done": "#166534",
};

function getColor(state: State): string {
  return COLUMN_COLORS[state.title] ?? state.color;
}

@customElement("state-selector")
export class StateSelector extends LitElement {
  @property({ type: Array })
  states: State[] = [];

  @property({ type: String })
  activeStateId = "";

  @state()
  private focusedIndex = -1;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .state-item {
      display: flex;
      align-items: center;
      gap: var(--space-xs);
      padding: var(--space-xs) var(--space-sm);
      border: 3px solid var(--color-black);
      cursor: pointer;
      transition: background var(--ease-brutal), color var(--ease-brutal);
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      font-weight: 700;
      min-width: 100px;
      background: var(--color-white);
    }

    .state-item:hover {
      background: var(--color-bg);
    }

    .state-item.active {
      background: var(--color-black);
      color: var(--color-white);
      border-color: var(--color-black);
    }

    .state-dot {
      width: 10px;
      height: 10px;
      border: 2px solid var(--color-black);
      flex-shrink: 0;
    }

    .state-item.active .state-dot {
      border-color: var(--color-white);
    }

    .state-label {
      flex: 1;
    }

    .state-item:focus-visible {
      outline: 3px solid var(--color-accent);
      outline-offset: 2px;
    }
  `;

  private _selectState(stateId: string): void {
    this.dispatchEvent(
      new CustomEvent("state-change", {
        detail: { stateId },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _handleKeydown(e: KeyboardEvent): void {
    if (this.states.length === 0) return;
    const currentIdx = this.focusedIndex >= 0
      ? this.focusedIndex
      : this.states.findIndex((s) => s.id === this.activeStateId);
    let newIdx = currentIdx;

    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      newIdx = Math.min(currentIdx + 1, this.states.length - 1);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      newIdx = Math.max(currentIdx - 1, 0);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const state = this.states[this.focusedIndex];
      if (state) this._selectState(state.id);
      return;
    }

    if (newIdx !== currentIdx) {
      this.focusedIndex = newIdx;
      const items = this.renderRoot.querySelectorAll(".state-item");
      (items[newIdx] as HTMLElement)?.focus();
    }
  }

  render() {
    return html`
      <div role="listbox" aria-label="State selector" @keydown="${this
        ._handleKeydown}">
        ${this.states.map((state) => {
          const isActive = state.id === this.activeStateId;
          const color = getColor(state);
          return html`
            <div
              class="state-item ${isActive ? "active" : ""}"
              role="option"
              aria-selected="${isActive}"
              tabindex="${isActive ? "0" : "-1"}"
              @click="${() => this._selectState(state.id)}"
            >
              <span class="state-dot" style="background:${color}"></span>
              <span class="state-label">${state.title}</span>
            </div>
          `;
        })}
      </div>
    `;
  }
}
