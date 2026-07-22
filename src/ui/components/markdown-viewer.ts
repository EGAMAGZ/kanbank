import { html, LitElement, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { customElement, property } from 'lit/decorators.js';

@customElement('markdown-viewer')
export class MarkdownViewer extends LitElement {
  @property({ type: String }) content = '';

  static styles = css`
    :host { display: block; white-space: pre-wrap; font-size: 14px; }
    :host(:host) h1, :host h2, :host h3 { margin: 16px 0 8px; }
    :host ul, :host ol { padding-left: 24px; }
    :host code { background: #f0f0f0; padding: 2px 4px; border-radius: 3px; font-size: 13px; }
    :host pre { background: #f0f0f0; padding: 12px; border-radius: 4px; overflow-x: auto; }
  `;

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  private renderMarkdown(md: string): string {
    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/^- \[ \] (.+)$/gm, '<li><input type="checkbox" disabled> $1</li>');
    html = html.replace(/^- \[x\] (.+)$/gm, '<li><input type="checkbox" checked disabled> $1</li>');
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/\n/g, '<br>');

    return html;
  }

  render() {
    return html`${unsafeHTML(this.renderMarkdown(this.content))}`;
  }
}
