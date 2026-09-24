import { css, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import { isEditableTarget } from "../helpers/shortcuts.js";
import "./keycap.js";

@customElement("bottom-bar")
export class BottomBar extends LitElement {
  @state()
  private showNotifications = false;

  static styles = css`
    :host {
      position: fixed;
      left: 0;
      right: 0;
      bottom: var(--space-md);
      display: flex;
      justify-content: center;
      z-index: 50;
      pointer-events: none;
    }

    .bottombar {
      display: flex;
      gap: var(--space-sm);
      pointer-events: auto;
    }

    .bottom-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-sm);
      background: var(--color-white);
      border: var(--line-thick) solid var(--color-black);
      box-shadow: var(--shadow-brutal);
      color: var(--color-text);
      font-size: var(--text-sm);
      font-weight: 700;
      padding: var(--space-xs) var(--space-md);
      cursor: pointer;
      transition: transform var(--ease-brutal), box-shadow var(--ease-brutal);
      position: relative;
    }

    .bottom-btn:hover {
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0 var(--color-black);
      background: var(--color-accent);
      color: var(--color-white);
    }

    .popover {
      position: absolute;
      background: var(--color-white);
      border: var(--line-thicker) solid var(--color-black);
      box-shadow: var(--shadow-brutal-md);
      padding: var(--space-xs) 0;
      z-index: 5;
      min-width: 240px;
      top: 8px;
      right: 0;
      left: auto;
    }

    .notif-panel {
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      color: var(--color-text-3);
      padding: var(--space-sm) var(--space-lg);
      white-space: nowrap;
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.boundKeydown = this.handleKeydown.bind(this);
    document.addEventListener("keydown", this.boundKeydown);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.boundKeydown) {
      document.removeEventListener("keydown", this.boundKeydown);
      this.boundKeydown = null;
    }
  }

  private boundKeydown: ((e: KeyboardEvent) => void) | null = null;

  private pageActive(): boolean {
    return (this.getRootNode() as ShadowRoot).host?.getAttribute("state") ===
      "active";
  }

  handleKeydown(e: KeyboardEvent): void {
    if (!this.pageActive()) return;
    if (isEditableTarget(e)) return;

    switch (e.code) {
      case "KeyF":
        e.preventDefault();
        this.openPinned();
        break;
      case "KeyK":
        e.preventDefault();
        this.openSearch();
        break;
      case "KeyN":
        e.preventDefault();
        this.toggleNotifications();
        break;
      case "Escape":
        this.showNotifications = false;
        break;
    }
  }

  private openPinned(): void {
    window.dispatchEvent(new CustomEvent("toggle-pinned"));
  }

  private openSearch(): void {
    window.dispatchEvent(new CustomEvent("open-command-bar"));
  }

  private toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  render() {
    return html`
      <footer class="bottombar">
        <button class="bottom-btn" @click="${this.openPinned}">
          Pinned <keycap-el key="F"></keycap-el>
        </button>
        <button class="bottom-btn" @click="${this.openSearch}">
          Search <keycap-el key="K"></keycap-el>
        </button>
        <button class="bottom-btn" @click="${this.toggleNotifications}">
          Notifications <keycap-el key="N"></keycap-el>
          ${this.showNotifications
            ? html`
              <span style="position:relative;">
                <div class="popover">
                  <div class="notif-panel">You're all caught up</div>
                </div>
              </span>
            `
            : ""}
        </button>
      </footer>
    `;
  }
}