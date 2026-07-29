import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("quick-actions")
export class QuickActions extends LitElement {
  @property({ type: Boolean })
  isGold = false;

  @property({ type: Boolean })
  isPinned = false;

  @property({ type: Boolean })
  isSubscribed = false;

  @property({ type: Boolean })
  hasCover = false;

  static styles = css`
    :host {
      display: flex;
      gap: var(--space-xs);
      flex-wrap: wrap;
    }

    .action-btn {
      width: 36px;
      height: 36px;
      border: 3px solid var(--color-black);
      background: var(--color-white);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      transition: background var(--ease-brutal), color var(--ease-brutal), transform var(--ease-brutal), box-shadow var(--ease-brutal);
      box-shadow: 3px 3px 0 var(--color-black);
      padding: 0;
    }

    .action-btn:hover {
      transform: translate(1px, 1px);
      box-shadow: 2px 2px 0 var(--color-black);
    }

    .action-btn:active {
      transform: translate(3px, 3px);
      box-shadow: 0 0 0 var(--color-black);
    }

    .action-btn.active-gold {
      background: var(--color-gold);
      color: var(--color-black);
    }

    .action-btn.active-pin {
      background: var(--color-black);
      color: var(--color-white);
    }

    .action-btn.active-bell {
      background: var(--color-accent);
      color: var(--color-white);
    }

    .action-btn.active-cover {
      background: var(--color-success);
      color: var(--color-white);
    }
  `;

  private _emit(name: string): void {
    this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true }));
  }

  render() {
    return html`
      <button class="action-btn ${this.isGold ? "active-gold" : ""}" @click="${() => this._emit("toggle-gold")}" title="Golden ticket">
        ${this.isGold ? "★" : "☆"}
      </button>
      <button class="action-btn ${this.hasCover ? "active-cover" : ""}" @click="${() => this._emit("toggle-cover")}" title="Cover image">
        🖼
      </button>
      <button class="action-btn ${this.isSubscribed ? "active-bell" : ""}" @click="${() => this._emit("toggle-subscribe")}" title="Notifications">
        ${this.isSubscribed ? "🔔" : "🔕"}
      </button>
      <button class="action-btn ${this.isPinned ? "active-pin" : ""}" @click="${() => this._emit("toggle-pin")}" title="Pin card">
        ${this.isPinned ? "📌" : "📍"}
      </button>
    `;
  }
}
