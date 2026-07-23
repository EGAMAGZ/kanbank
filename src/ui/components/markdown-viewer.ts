import { html, LitElement, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { customElement, property } from 'lit/decorators.js';

@customElement('markdown-viewer')
export class MarkdownViewer extends LitElement {
  @property({ type: String }) content = '';

  static styles = css`
    :host { display: block; white-space: pre-wrap; font-size: var(--text-base); line-height: var(--leading-loose); }
    :host h1, :host h2, :host h3 { margin: var(--space-lg) 0 var(--space-sm); font-family: var(--font-display); font-weight: 800; letter-spacing: -0.03em; }
    :host ul, :host ol { padding-left: var(--space-lg); }
    :host code { background: var(--color-bg); padding: 2px var(--space-xs); font-size: var(--text-sm); font-family: 'SF Mono', 'Fira Code', monospace; }
    :host pre { background: var(--color-bg); padding: var(--space-md); overflow-x: auto; }
    :host pre code { padding: 0; background: none; }
    :host img { max-width: 100%; margin: var(--space-sm) 0; }
    :host a { color: var(--color-accent); }
  `;

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
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    html = html.replace(/\n/g, '<br>');

    return html;
  }

  render() {
    return html`${unsafeHTML(this.renderMarkdown(this.content))}`;
  }
}
