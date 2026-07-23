import { html, LitElement, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('task-editor')
export class TaskEditor extends LitElement {
  @property({ type: String }) stateId = '';
  @state() private taskTitle = '';

  static styles = css`
    :host { display: block; margin-top: 8px; }
    input {
      width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;
    }
  `;

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  private handleSubmit(e: KeyboardEvent): void {
    if (e.key === 'Enter' && this.taskTitle.trim()) {
      this.dispatchEvent(new CustomEvent('task-create', {
        detail: { stateId: this.stateId, title: this.taskTitle.trim() },
        bubbles: true,
        composed: true,
      }));
      this.taskTitle = '';
    }
  }

  render() {
    return html`
      <input
        type="text"
        placeholder="Add task..."
        .value="${this.taskTitle}"
        @input="${(e: Event) => this.taskTitle = (e.target as HTMLInputElement).value}"
        @keydown="${this.handleSubmit}"
      />
    `;
  }
}
