import { html, LitElement, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Board } from '../../domain/entities/board.entity.js';

@customElement('board-card')
export class BoardCard extends LitElement {
  @property({ type: Object }) board!: Board;

  static styles = css`
    :host {
      display: block; border: 1px solid #ddd; border-radius: 8px;
      padding: 16px; cursor: pointer; transition: box-shadow 0.2s;
    }
    :host(:hover) { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h3 { margin: 0 0 8px; }
    p { margin: 0; color: #666; font-size: 14px; }
  `;

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  render() {
    return html`
      <h3>${this.board.title}</h3>
      ${this.board.description ? html`<p>${this.board.description}</p>` : ''}
    `;
  }
}
