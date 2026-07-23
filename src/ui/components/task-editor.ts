import { html, LitElement, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('task-editor')
export class TaskEditor extends LitElement {
  @property({ type: String }) stateId = '';
  @state() private taskTitle = '';

  static styles = css`
    :host { display: block; margin-top: var(--space-sm); }
    input {
      width: 100%;
      padding: var(--space-sm) var(--space-md);
      border: 2px solid #000;
      box-sizing: border-box;
      font-family: var(--font-body);
      font-size: var(--text-sm);
      outline: none;
      background: var(--color-white);
    }
    input:focus {
      box-shadow: 2px 2px 0 var(--color-accent);
    }
  `;

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
