import { html, LitElement, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Board } from '../../domain/entities/board.entity.js';

@customElement('board-card')
export class BoardCard extends LitElement {
  @property({ type: Object }) board!: Board;

  static styles = css`
    :host {
      display: block;
      border: 2px solid #000;
      box-shadow: 6px 6px 0 #000;
      padding: var(--space-lg);
      cursor: pointer;
      background: var(--color-white);
      transition: transform 0.1s, box-shadow 0.1s;
    }
    :host(:hover) {
      transform: translate(3px, 3px);
      box-shadow: 3px 3px 0 #000;
    }
    :host(:active) {
      transform: translate(6px, 6px);
      box-shadow: 0 0 0 #000;
    }
    h3 {
      margin: 0 0 var(--space-sm);
      font-family: var(--font-display);
      font-weight: 800;
      font-size: var(--text-xl);
      letter-spacing: -0.03em;
    }
    p {
      margin: 0;
      color: var(--color-text-2);
      font-size: var(--text-sm);
      line-height: var(--leading-normal);
    }
  `;

  render() {
    return html`
      <h3>${this.board.title}</h3>
      ${this.board.description ? html`<p>${this.board.description}</p>` : ''}
    `;
  }
}
