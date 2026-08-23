import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import "../../ui/components/keycap.js";

@customElement("quick-actions")
export class QuickActions extends LitElement {
  @property({ type: Boolean })
  hidePrimary = false;

  static styles = css`
    :host {
      display: flex;
      gap: var(--space-sm);
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: var(--space-xs);
      padding: var(--space-xs) var(--space-md);
      border: 3px solid var(--color-black);
      cursor: pointer;
      font-size: var(--text-xs);
      font-weight: 700;
      font-family: var(--font-mono);
      background: var(--color-white);
      color: var(--color-black);
      transition: background var(--ease-brutal), color var(--ease-brutal), transform
        var(--ease-brutal), box-shadow var(--ease-brutal);
      box-shadow: 4px 4px 0 var(--color-black);
      min-height: 38px;
    }

    .action-btn:hover {
      transform: translate(1px, 1px);
      box-shadow: 3px 3px 0 var(--color-black);
    }

    .action-btn:active {
      transform: translate(4px, 4px);
      box-shadow: 0 0 0 var(--color-black);
    }

    .action-btn.primary {
      background: var(--color-accent);
      color: var(--color-white);
    }

    .action-btn.primary:hover {
      background: var(--color-black);
    }

    .action-btn.danger {
      background: var(--color-white);
      color: var(--color-error);
    }

    .action-btn.danger:hover {
      background: var(--color-error);
      color: var(--color-white);
    }
  `;

  private _emit(name: string): void {
    this.dispatchEvent(
      new CustomEvent(name, { bubbles: true, composed: true }),
    );
  }

  render() {
    if (this.hidePrimary) return html``;
    return html`
      <button class="action-btn primary" @click="${() =>
        this._emit("mark-done")}">
        DONE <keycap-el key="D"></keycap-el>
      </button>
      <button class="action-btn primary" @click="${() =>
        this._emit("edit-task")}">
        EDIT <keycap-el key="E"></keycap-el>
      </button>
    `;
  }
}
