import { css, html, LitElement } from "lit";
import { classMap } from "lit/directives/class-map.js";
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

  @state()
  private editingStepId: string | null = null;

  @state()
  private editingStepText = "";

  static styles = css`
    :host {
      display: block;
    }

    .step {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-xs) 0;
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
      min-width: 0;
      font-family: var(--font-body);
      font-size: var(--text-base);
      line-height: var(--leading-normal);
      border: none;
      outline: none;
      background: transparent;
      padding: var(--space-xs);
      cursor: pointer;
      word-break: break-word;
    }

    .step-text.done {
      text-decoration: line-through;
      color: var(--color-text-3);
    }

    .step-text:hover {
      background: var(--color-bg);
    }

    .step-edit-input {
      flex: 1;
      padding: var(--space-xs);
      border: 3px solid var(--color-black);
      font-family: var(--font-body);
      font-size: var(--text-base);
      outline: none;
      background: var(--color-white);
    }

    .edit-btn {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 3px solid var(--color-black);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      background: var(--color-white);
      transition: background var(--ease-brutal), color var(--ease-brutal);
      flex-shrink: 0;
      padding: 0;
    }

    .edit-btn.save:hover {
      background: var(--color-success);
      color: var(--color-white);
    }

    .edit-btn.delete:hover {
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
      border: none;
      border-bottom: 2px solid var(--color-black);
      font-family: var(--font-body);
      font-size: var(--text-sm);
      outline: none;
      background: transparent;
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

  private _startEditStep(id: string): void {
    const step = this.steps.find((s) => s.id === id);
    if (!step) return;
    this.editingStepId = id;
    this.editingStepText = step.text;
  }

  private _saveEditStep(): void {
    if (!this.editingStepId || !this.editingStepText.trim()) return;
    this.dispatchEvent(
      new CustomEvent("step-update", {
        detail: { id: this.editingStepId, text: this.editingStepText.trim() },
        bubbles: true,
        composed: true,
      }),
    );
    this.editingStepId = null;
    this.editingStepText = "";
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

  private _handleEditKeydown(e: KeyboardEvent): void {
    if (e.key === "Enter") {
      e.preventDefault();
      this._saveEditStep();
    }
    if (e.key === "Escape") {
      this.editingStepId = null;
      this.editingStepText = "";
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
                <div class=${classMap({
                  "step-checkbox": true,
                  checked: step.checked,
                })}
                  data-id="${step.id}"
                  @click="${this._toggleStep}"
                ></div>
                ${this.editingStepId === step.id
                  ? html`
                    <input class="step-edit-input" type="text" .value="${this.editingStepText}"
                      @input="${(e: InputEvent) => { this.editingStepText = (e.target as HTMLInputElement).value; }}"
                      @keydown="${this._handleEditKeydown}"
                    />
                    <button class="edit-btn save" @click="${this._saveEditStep}">✓</button>
                    <button class="edit-btn delete" data-id="${step.id}" @click="${this._deleteStep}">✕</button>
                  `
                  : html`
                    <span class=${classMap({
                      "step-text": true,
                      done: step.checked,
                    })}
                      @click="${() => this._startEditStep(step.id)}">${step.text}</span>
                  `}
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
      </div>
    `;
  }
}
