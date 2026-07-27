import { css, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";

@customElement("image-upload")
export class ImageUpload extends LitElement {
  @state()
  private previewUrls: string[] = [];

  static styles = css`
    :host {
      display: block;
    }
    .trigger {
      display: inline-flex;
      align-items: center;
      gap: var(--space-xs);
      color: var(--color-accent);
      cursor: pointer;
      font-size: var(--text-sm);
      font-weight: 500;
      margin-top: var(--space-sm);
    }
    .trigger:hover {
      text-decoration: underline;
      text-underline-offset: 3px;
    }
    input[type="file"] {
      display: none;
    }
    .previews {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-sm);
      margin-top: var(--space-sm);
    }
    .preview-item {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-sm);
      border: 2px solid #000;
    }
    .preview-item img {
      width: 50px;
      height: 50px;
      object-fit: cover;
    }
    .preview-item .remove {
      cursor: pointer;
      color: var(--color-error);
      font-size: var(--text-lg);
      padding: 0 var(--space-xs);
      line-height: 1;
    }
  `;

  private onFileChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;

    const urls = files.map((f) => URL.createObjectURL(f));
    this.previewUrls = [...this.previewUrls, ...urls];

    this.dispatchEvent(
      new CustomEvent("image-selected", {
        detail: { files },
        bubbles: true,
        composed: true,
      }),
    );

    input.value = "";
  }

  clear(): void {
    this.revokeAll();
    this.previewUrls = [];
    const input = this.shadowRoot?.querySelector('input[type="file"]') as
      | HTMLInputElement
      | null;
    if (input) input.value = "";
  }

  private revokeAll(): void {
    for (const url of this.previewUrls) {
      URL.revokeObjectURL(url);
    }
  }

  render() {
    return html`
      ${this.previewUrls.length
        ? html`
          <div class="previews">
            ${this.previewUrls.map((url, i) =>
              html`
                <div class="preview-item">
                  <img src="${url}" alt="Preview" />
                  <span class="remove" @click="${() => {
                    URL.revokeObjectURL(this.previewUrls[i]);
                    this.previewUrls = this.previewUrls.filter((_, idx) =>
                      idx !== i
                    );
                  }}">&times;</span>
                </div>
              `
            )}
          </div>
        `
        : ""}
      <label class="trigger">
        Attach image${this.previewUrls.length ? "s" : ""}
        <input type="file" accept="image/*" multiple @change="${this
          .onFileChange}" />
      </label>
    `;
  }
}
