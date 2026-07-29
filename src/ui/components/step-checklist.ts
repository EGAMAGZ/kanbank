import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { Step } from "../../domain/entities/step.entity.js";

@customElement("step-checklist")
export class StepChecklist extends LitElement {
  @property({ type: Array })
  steps: Step[] = [];

  @property({ type: Boolean })
  editable = false;

  @state()
  private newStepText = "";

  static styles = css`
    :host {
      display: block;
    }

    .step {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-xs) 0;
      border-bottom: 2px solid var(--color-black);
    }

    .step-checkbox {
      width: 22px;
      height: 22px;
      border: 3px solid var(--color-black);
      background: var(--color-white);
      cursor: pointer;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 700;
      line-height: 1;
      transition: background var(--ease-brutal);
      user-select: none;
    }

    .step-checkbox:hover {
      background: var(--color-bg);
    }

    .step-checkbox.checked {
      background: var(--color-black);
      color: var(--color-white);
    }

    .step-checkbox.checked::after {
      content: "X";
      font-family: var(--font-mono);
      font-size: 14px;
      font-weight: 700;
    }

    .step-text {
      flex: 1;
      font-family: var(--font-body);
      font-size: var(--text-base);
      line-height: var(--leading-normal);
      border: none;
      outline: none;
      background: transparent;
      padding: 0;
    }

    .step-text.done {
      text-decoration: line-through;
      color: var(--color-text-3);
    }

    .step-delete {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--color-black);
      background: var(--color-white);
      cursor: pointer;
      font-size: 10px;
      font-weight: 700;
      opacity: 0;
      transition: opacity var(--ease-brutal), background var(--ease-brutal);
      flex-shrink: 0;
      padding: 0;
    }

    .step:hover .step-delete {
      opacity: 1;
    }

    .step-delete:hover {
      background: var(--color-error);
      color: var(--color-white);
    }

    .add-step {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      margin-top: var(--space-sm);
    }

    .add-step-input {
      flex: 1;
      padding: var(--space-sm);
      border: 3px dashed var(--color-black);
      font-family: var(--font-body);
      font-size: var(--text-sm);
      outline: none;
      background: var(--color-white);
    }

    .add-step-input:focus {
      border-style: solid;
    }

    .add-step-btn {
      padding: var(--space-xs) var(--space-md);
      border: 3px solid var(--color-black);
      background: var(--color-black);
      color: var(--color-white);
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      font-weight: 700;
      cursor: pointer;
      transition: background var(--ease-brutal);
    }

    .add-step-btn:hover {
      background: var(--color-accent);
    }
  `;

  private _toggleStep(e: Event): void {
    const id = (e.currentTarget as HTMLElement).dataset.id;
    if (!id) return;
    const step = this.steps.find((s) => s.id === id);
    if (!step) return;
    this.dispatchEvent(
      new CustomEvent("step-toggle", {
        detail: { id, checked: !step.checked },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _deleteStep(e: Event): void {
    const id = (e.currentTarget as HTMLElement).dataset.id;
    if (!id) return;
    this.dispatchEvent(
      new CustomEvent("step-delete", {
        detail: { id },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _handleAddStep(): void {
    if (!this.newStepText.trim()) return;
    this.dispatchEvent(
      new CustomEvent("step-add", {
        detail: { text: this.newStepText.trim() },
        bubbles: true,
        composed: true,
      }),
    );
    this.newStepText = "";
  }

  private _handleKeydown(e: KeyboardEvent): void {
    if (e.key === "Enter") {
      e.preventDefault();
      this._handleAddStep();
    }
  }

  render() {
    return html`
      <div>
        ${this.steps.length === 0
          ? html`
            <div
              style="font-family:var(--font-mono);font-size:var(--text-xs);color:var(--color-text-3);padding:var(--space-sm) 0;">No steps yet</div>
          `
          : this.steps.map((step) =>
            html`
              <div class="step">
                <div class="step-checkbox ${step.checked ? "checked" : ""}"
                  data-id="${step.id}"
                  @click="${this._toggleStep}"
                ></div>
                <span class="step-text ${step.checked ? "done" : ""}">${step
                  .text}</span>
                <button class="step-delete" data-id="${step.id}"
                  @click="${this._deleteStep}">✕</button>
              </div>
            `
          )}
      </div>
      <div class="add-step">
        <input class="add-step-input"
          type="text"
          placeholder="Add a step..."
          .value="${this.newStepText}"
          @input="${(e: InputEvent) => {
            this.newStepText = (e.target as HTMLInputElement).value;
          }}"
          @keydown="${this._handleKeydown}"
        />
        <button class="add-step-btn" @click="${this._handleAddStep}"
          ?disabled="${!this.newStepText.trim()}">+</button>
      </div>
    `;
  }
}
