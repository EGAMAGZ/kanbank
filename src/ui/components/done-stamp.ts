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
      bottom: var(--space-sm);
      right: var(--space-sm);
      z-index: 10;
      transform: rotate(8deg);
    }

    .stamp {
      border: 4px solid var(--color-black);
      color: var(--color-white);
      padding: var(--space-sm) var(--space-md);
      font-family: var(--font-mono);
      font-size: var(--text-base);
      font-weight: 700;
      text-align: center;
      line-height: var(--leading-tight);
      box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.3);
      position: relative;
    }

    .stamp::before,
    .stamp::after {
      content: "";
      position: absolute;
      width: 12px;
      height: 12px;
      border: 2px solid var(--color-black);
      background: var(--color-white);
    }

    .stamp::before {
      top: -6px;
      left: -6px;
    }

    .stamp::after {
      bottom: -6px;
      right: -6px;
    }

    .label {
      font-size: 18px;
      letter-spacing: 2px;
    }

    .date-line {
      border-top: 3px solid var(--color-white);
      padding-top: 4px;
      margin-top: 4px;
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
