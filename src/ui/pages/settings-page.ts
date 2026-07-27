import { css, html, LitElement } from "lit";
import { PageController } from "@open-cells/page-controller";
import { customElement, state } from "lit/decorators.js";
import {
  getAutoDiscardDays,
  setAutoDiscardDays,
} from "../../shared/constants/defaults.js";

@customElement("settings-page")
export class SettingsPage extends LitElement {
  pageController = new PageController(this);

  @state()
  private discardDaysInput = "";

  @state()
  private discardEnabled = false;

  @state()
  private saved = false;

  static styles = css`
    :host {
      display: block;
      padding: var(--space-2xl) var(--space-lg);
      max-width: 720px;
      margin: 0 auto;
      overflow-y: auto;
      height: 100%;
    }

    h1 {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: var(--text-3xl);
      letter-spacing: -0.04em;
      margin-bottom: var(--space-2xl);
    }

    .section {
      border: 2px solid var(--color-black);
      box-shadow: var(--shadow-brutal-md);
      background: var(--color-white);
      padding: var(--space-xl);
      margin-bottom: var(--space-xl);
    }

    .section h2 {
      margin: 0 0 var(--space-lg);
      font-family: var(--font-display);
      font-size: var(--text-xl);
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .section p {
      color: var(--color-text-2);
      font-size: var(--text-sm);
      margin: 0 0 var(--space-lg);
      line-height: var(--leading-normal);
    }

    .field-row {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      margin-bottom: var(--space-md);
    }

    .field-row label {
      font-weight: 700;
      font-size: var(--text-sm);
      min-width: 180px;
    }

    .field-row input[type="number"] {
      width: 80px;
      padding: var(--space-xs) var(--space-sm);
      border: 2px solid var(--color-black);
      font-family: var(--font-body);
      font-size: var(--text-sm);
      outline: none;
      text-align: center;
      transition: box-shadow var(--ease-brutal);
    }

    .field-row input[type="number"]:focus {
      box-shadow: 2px 2px 0 var(--color-accent);
    }

    .field-row input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    .btn-save {
      padding: var(--space-sm) var(--space-md);
      border: 2px solid var(--color-black);
      box-shadow: 3px 3px 0 var(--color-black);
      background: var(--color-accent);
      color: var(--color-white);
      font-size: var(--text-sm);
      font-weight: 700;
      font-family: var(--font-body);
      cursor: pointer;
      transition: transform var(--ease-brutal), box-shadow var(--ease-brutal);
    }

    .btn-save:hover {
      transform: translate(1px, 1px);
      box-shadow: 2px 2px 0 var(--color-black);
    }

    .btn-save:active {
      transform: translate(3px, 3px);
      box-shadow: 0 0 0 var(--color-black);
    }

    .saved-msg {
      color: var(--color-accent);
      font-size: var(--text-sm);
      font-weight: 700;
      margin-left: var(--space-md);
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    const current = getAutoDiscardDays();
    this.discardEnabled = current !== null;
    this.discardDaysInput = current !== null ? String(current) : "";
  }

  private handleToggleDiscard(): void {
    this.discardEnabled = !this.discardEnabled;
    if (!this.discardEnabled) {
      this.discardDaysInput = "";
    } else if (!this.discardDaysInput) {
      this.discardDaysInput = "7";
    }
  }

  private handleSave(): void {
    if (this.discardEnabled) {
      const days = Number(this.discardDaysInput);
      if (Number.isFinite(days) && days > 0) {
        setAutoDiscardDays(days);
      }
    } else {
      setAutoDiscardDays(null);
    }
    this.saved = true;
    setTimeout(() => (this.saved = false), 2000);
  }

  render() {
    return html`
      <h1>Settings</h1>

      <div class="section">
        <h2>Auto-Discard</h2>
        <p>
          Automatically move inactive tasks to "Not now" after a configured
          number of days. Only applies to tasks not in "Not now" or "Done"
          states.
        </p>
        <div class="field-row">
          <label for="discard-toggle">Enable auto-discard</label>
          <input
            id="discard-toggle"
            type="checkbox"
            .checked="${this.discardEnabled}"
            @change="${this.handleToggleDiscard}"
          />
        </div>
        ${this.discardEnabled
          ? html`
            <div class="field-row">
              <label for="discard-days">Days before discard</label>
              <input
                id="discard-days"
                type="number"
                min="1"
                .value="${this.discardDaysInput}"
                @input="${(e: Event) => {
                  this.discardDaysInput =
                    (e.target as HTMLInputElement).value;
                }}"
              />
              <span style="font-size:var(--text-sm);color:var(--color-text-2);">days</span>
            </div>
          `
          : ""}
        <div style="margin-top:var(--space-lg);display:flex;align-items:center;">
          <button class="btn-save" @click="${this.handleSave}">Save</button>
          ${this.saved
            ? html`<span class="saved-msg">Saved!</span>`
            : ""}
        </div>
      </div>
    `;
  }
}
