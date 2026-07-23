import { html, LitElement, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('image-upload')
export class ImageUpload extends LitElement {
  @state() private previewUrls: string[] = [];

  static styles = css`
    :host { display: block; }
    .trigger {
      display: inline-flex; align-items: center; gap: 4px;
      color: #0066cc; cursor: pointer; font-size: 13px; margin-top: 8px;
    }
    .trigger:hover { text-decoration: underline; }
    input[type="file"] { display: none; }
    .previews {
      display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;
    }
    .preview-item {
      display: flex; align-items: center; gap: 6px;
      padding: 6px; border: 1px solid #ddd; border-radius: 4px;
    }
    .preview-item img {
      width: 50px; height: 50px; object-fit: cover; border-radius: 4px;
    }
    .preview-item .remove {
      cursor: pointer; color: #cc0000; font-size: 16px; padding: 0 2px;
    }
  `;

  private onFileChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;

    const urls = files.map(f => URL.createObjectURL(f));
    this.previewUrls = [...this.previewUrls, ...urls];

    this.dispatchEvent(new CustomEvent('image-selected', {
      detail: { files },
      bubbles: true,
      composed: true,
    }));

    input.value = '';
  }

  clear(): void {
    this.revokeAll();
    this.previewUrls = [];
    const input = this.shadowRoot?.querySelector('input[type="file"]') as HTMLInputElement | null;
    if (input) input.value = '';
  }

  private revokeAll(): void {
    for (const url of this.previewUrls) {
      URL.revokeObjectURL(url);
    }
  }

  render() {
    return html`
      ${this.previewUrls.length ? html`
        <div class="previews">
          ${this.previewUrls.map((url, i) => html`
            <div class="preview-item">
              <img src="${url}" alt="Preview" />
              <span class="remove" @click="${() => {
                URL.revokeObjectURL(this.previewUrls[i]);
                this.previewUrls = this.previewUrls.filter((_, idx) => idx !== i);
              }}">&times;</span>
            </div>
          `)}
        </div>
      ` : ''}
      <label class="trigger">
        🖼️ Attach image${this.previewUrls.length ? 's' : ''}
        <input type="file" accept="image/*" multiple @change="${this.onFileChange}" />
      </label>
    `;
  }
}
