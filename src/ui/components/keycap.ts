import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { keycapLabel } from "../helpers/shortcuts.js";

@customElement("keycap-el")
export class Keycap extends LitElement {
  @property({ type: String })
  key = "";

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    kbd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 22px;
      height: 22px;
      padding: 0 4px;
      border: 2px solid var(--color-black);
      box-shadow: 2px 2px 0 var(--color-black);
      background: var(--color-white);
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 700;
      line-height: 1;
      color: var(--color-text);
      text-transform: uppercase;
    }

    :host(:active) kbd {
      transform: translate(2px, 2px);
      box-shadow: 0 0 0 var(--color-black);
    }
  `;

  render() {
    return html`<kbd>${keycapLabel(this.key)}</kbd>`;
  }
}
