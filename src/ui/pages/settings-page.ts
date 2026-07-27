import { html, LitElement } from 'lit';
import { PageController } from '@open-cells/page-controller';
import { customElement } from 'lit/decorators.js';

@customElement('settings-page')
export class SettingsPage extends LitElement {
  pageController = new PageController(this);

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  render() {
    return html`
      <div style="padding: var(--space-xl) var(--space-lg); max-width: 720px; margin: 0 auto; overflow-y: auto; height: 100%;">
        <h1 style="font-family: var(--font-display); font-weight: 800; font-size: var(--text-3xl); letter-spacing: -0.04em; margin-bottom: var(--space-lg);">Settings</h1>
        <p style="color: var(--color-text-3); font-size: var(--text-lg);">Coming soon.</p>
      </div>
    `;
  }
}
