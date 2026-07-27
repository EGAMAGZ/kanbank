import { css, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";

@customElement("comment-editor")
export class CommentEditor extends LitElement {
  @state()
  private markdown = "";

  static styles = css`
    :host {
      display: block;
    }
    textarea {
      width: 100%;
      min-height: 80px;
      padding: var(--space-sm) var(--space-md);
      border: 2px solid #000;
      border-radius: 0;
      box-sizing: border-box;
      resize: vertical;
      font-family: var(--font-body);
      font-size: var(--text-sm);
      outline: none;
      background: var(--color-white);
    }
    textarea:focus {
      box-shadow: 2px 2px 0 var(--color-accent);
    }
    .btn {
      margin-top: var(--space-sm);
      padding: var(--space-sm) var(--space-md);
      border: 2px solid #000;
      box-shadow: 3px 3px 0 #000;
      cursor: pointer;
      background: var(--color-accent);
      color: white;
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 700;
      transition: transform 0.1s, box-shadow 0.1s;
    }
    .btn:hover {
      transform: translate(1px, 1px);
      box-shadow: 2px 2px 0 #000;
    }
  `;

  private handleSubmit(): void {
    if (!this.markdown.trim()) return;
    this.dispatchEvent(
      new CustomEvent("comment-add", {
        detail: { markdown: this.markdown.trim() },
        bubbles: true,
        composed: true,
      }),
    );
    this.markdown = "";
  }

  render() {
    return html`
      <textarea
        placeholder="Add a comment..."
        .value="${this.markdown}"
        @input="${(e: Event) =>
          this.markdown = (e.target as HTMLTextAreaElement).value}"
      ></textarea>
      <button class="btn" @click="${this.handleSubmit}">Add Comment</button>
    `;
  }
}
