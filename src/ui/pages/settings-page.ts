import { css, html, LitElement } from "lit";
import { PageController } from "@open-cells/page-controller";
import { customElement } from "lit/decorators.js";
import "../../ui/components/auto-close-dial.js";

@customElement("settings-page")
export class SettingsPage extends LitElement {
  pageController = new PageController(this);

  static styles = css`
    :host {
      display: block;
      padding: var(--space-2xl) var(--gutter-lg);
      max-width: 720px;
      margin: 0 auto;
      overflow-y: auto;
      height: 100%;
    }

    .page-title {
      font-family: var(--font-display);
      font-weight: 900;
      font-size: var(--text-3xl);
      letter-spacing: -0.04em;
      margin-bottom: var(--space-2xl);
      border-bottom: var(--line-thicker) solid var(--color-black);
      padding-bottom: var(--space-md);
    }

    .section {
      border: var(--line-thicker) solid var(--color-black);
      box-shadow: var(--shadow-brutal-md);
      background: var(--color-white);
      padding: var(--space-xl);
      margin-bottom: var(--space-xl);
    }

    .section-title {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: var(--text-xl);
      letter-spacing: -0.02em;
      margin: 0 0 var(--space-lg);
      border-bottom: var(--line-thick) solid var(--color-black);
      padding-bottom: var(--space-sm);
    }

    .section p {
      color: var(--color-text-2);
      font-size: var(--text-sm);
      margin: 0 0 var(--space-lg);
      line-height: var(--leading-normal);
      font-family: var(--font-mono);
    }

    .dial-section {
      display: flex;
      justify-content: center;
      padding: var(--space-lg) 0;
    }
  `;

  render() {
    return html`
      <h1 class="page-title">Settings</h1>

      <div class="section">
        <h2 class="section-title">Auto-Close</h2>
        <p>Automatically move inactive tasks to "Not now" after a configured number of days.</p>
        <div class="dial-section">
          <auto-close-dial></auto-close-dial>
        </div>
      </div>
    `;
  }
}
