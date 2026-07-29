import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("done-stamp")
export class DoneStamp extends LitElement {
  @property({ type: String })
  date = "";
  @property({ type: String })
  author = "AG";
  @property({ type: String, attribute: "bg-color" })
  bgColor = "#166534";

  static styles = css`
    :host {
      display: inline-block;
      position: absolute;
      top: var(--space-sm);
      right: var(--space-sm);
      z-index: 10;
      transform: rotate(8deg);
    }

    .stamp {
      border: 3px solid var(--color-black);
      color: var(--color-white);
      padding: var(--space-xs) var(--space-sm);
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      font-weight: 700;
      text-align: center;
      line-height: var(--leading-tight);
      box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3);
      position: relative;
    }

    .stamp::before,
    .stamp::after {
      content: "";
      position: absolute;
      width: 6px;
      height: 6px;
      border: 2px solid var(--color-black);
      background: var(--color-white);
    }

    .stamp::before {
      top: -4px;
      left: -4px;
    }

    .stamp::after {
      bottom: -4px;
      right: -4px;
    }

    .label {
      font-size: 9px;
      letter-spacing: 1px;
    }

    .date-line {
      border-top: 2px solid var(--color-white);
      padding-top: 2px;
      margin-top: 2px;
    }
  `;

  render() {
    return html`
      <div class="stamp" style="background:${this.bgColor}">
        <div class="label">DONE</div>
        <div class="date-line">${this.date} ${this.author}</div>
      </div>
    `;
  }
}
