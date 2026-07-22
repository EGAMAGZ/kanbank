import { html, LitElement, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('comment-editor')
export class CommentEditor extends LitElement {
  @state() private markdown = '';

  static styles = css`
    :host { display: block; }
    textarea {
      width: 100%; min-height: 80px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;
      box-sizing: border-box; resize: vertical;
    }
    .btn {
      margin-top: 8px; padding: 6px 12px; border: none; border-radius: 4px;
      cursor: pointer; background: #0066cc; color: white; font-size: 13px;
    }
  `;

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  private handleSubmit(): void {
    if (!this.markdown.trim()) return;
    this.dispatchEvent(new CustomEvent('comment-add', {
      detail: { markdown: this.markdown.trim() },
      bubbles: true,
      composed: true,
    }));
    this.markdown = '';
  }

  render() {
    return html`
      <textarea
        placeholder="Add a comment..."
        .value="${this.markdown}"
        @input="${(e: Event) => this.markdown = (e.target as HTMLTextAreaElement).value}"
      ></textarea>
      <button class="btn" @click="${this.handleSubmit}">Add Comment</button>
    `;
  }
}
