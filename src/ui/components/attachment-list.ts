import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { ImageRef } from "../../domain/value-objects/image-ref.js";
import { DexieImageRepository } from "../../infrastructure/storage/image-storage.service.js";

const imageRepo = new DexieImageRepository();

@customElement("attachment-list")
export class AttachmentList extends LitElement {
  @property({ type: Array })
  images: ImageRef[] = [];

  @property({ type: Boolean })
  deletable = false;

  @state()
  private blobs: Map<string, string> = new Map();

  static styles = css`
    :host {
      display: block;
    }

    .attachments {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-md);
    }

    .polaroid {
      width: 180px;
      border: 4px solid var(--color-black);
      background: var(--color-white);
      padding: var(--space-sm) var(--space-sm) var(--space-md);
      box-shadow: var(--shadow-brutal);
      display: flex;
      flex-direction: column;
    }

    .polaroid-img {
      width: 100%;
      height: 120px;
      object-fit: cover;
      border: 2px solid var(--color-black);
      display: block;
      background: var(--color-bg);
    }

    .polaroid-caption {
      margin-top: var(--space-xs);
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      line-height: var(--leading-snug);
    }

    .polaroid-name {
      font-weight: 700;
      word-break: break-all;
    }

    .polaroid-size {
      color: var(--color-text-3);
    }

    .polaroid-download {
      display: inline-block;
      margin-top: 2px;
      font-weight: 700;
      text-decoration: underline;
      text-underline-offset: 2px;
      text-decoration-thickness: 2px;
      cursor: pointer;
      color: var(--color-text);
    }

    .polaroid-download:hover {
      color: var(--color-accent);
    }

    .polaroid-delete {
      position: absolute;
      top: -8px;
      right: -8px;
      width: 24px;
      height: 24px;
      border: 3px solid var(--color-black);
      background: var(--color-white);
      cursor: pointer;
      font-size: 10px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background var(--ease-brutal), color var(--ease-brutal);
      padding: 0;
    }

    .polaroid-delete:hover {
      background: var(--color-error);
      color: var(--color-white);
    }

    .polaroid-wrap {
      position: relative;
    }

    .no-attachments {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-3);
      padding: var(--space-sm) 0;
    }

    .file-input {
      margin-top: var(--space-sm);
    }

    .file-input-label {
      display: inline-flex;
      align-items: center;
      gap: var(--space-xs);
      padding: var(--space-xs) var(--space-md);
      border: 3px solid var(--color-black);
      background: var(--color-white);
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      font-weight: 700;
      cursor: pointer;
      transition: background var(--ease-brutal);
    }

    .file-input-label:hover {
      background: var(--color-bg);
    }

    .file-input input {
      display: none;
    }
  `;

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    await this._loadBlobs();
  }

  updated(changed: Map<string, unknown>): void {
    if (changed.has("images")) {
      this._loadBlobs();
    }
  }

  private async _loadBlobs(): Promise<void> {
    const blobs = new Map<string, string>();
    for (const img of this.images) {
      try {
        const record = await imageRepo.get(img.id);
        if (record) {
          blobs.set(img.id, URL.createObjectURL(record));
        }
      } catch {
        // skip
      }
    }
    // revoke old blobs
    for (const url of this.blobs.values()) {
      URL.revokeObjectURL(url);
    }
    this.blobs = blobs;
    this.requestUpdate();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    for (const url of this.blobs.values()) {
      URL.revokeObjectURL(url);
    }
  }

  private _formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    return `${kb.toFixed(2)} KB`;
  }

  private _handleDownload(img: ImageRef): void {
    const url = this.blobs.get(img.id);
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = img.filename;
    a.click();
  }

  private _handleDelete(img: ImageRef): void {
    this.dispatchEvent(
      new CustomEvent("attachment-remove", {
        detail: { imageId: img.id },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _handleFileSelect(e: Event): void {
    const files = (e.target as HTMLInputElement).files;
    if (!files?.length) return;
    this.dispatchEvent(
      new CustomEvent("attachment-add", {
        detail: { files: Array.from(files) },
        bubbles: true,
        composed: true,
      }),
    );
    (e.target as HTMLInputElement).value = "";
  }

  render() {
    return html`
      <div class="attachments">
        ${this.images.length === 0
          ? html`<div class="no-attachments">No attachments</div>`
          : this.images.map((img) => {
            const url = this.blobs.get(img.id);
            return html`
              <div class="polaroid-wrap">
                <div class="polaroid">
                  ${url
                    ? html`<img class="polaroid-img" src="${url}" alt="${img.filename}" />`
                    : html`
                      <div class="polaroid-img"
                        style="display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:var(--text-xs);color:var(--color-text-3);">loading...</div>
                    `}
                  <div class="polaroid-caption">
                    <div class="polaroid-name">${img.filename}</div>
                    <div class="polaroid-size">${this._formatSize(
                      img.size,
                    )}</div>
                    <span class="polaroid-download" @click="${() =>
                      this._handleDownload(img)}">Download</span>
                  </div>
                </div>
                ${this.deletable
                  ? html`<button class="polaroid-delete" @click="${() =>
                    this._handleDelete(img)}">✕</button>`
                  : ""}
              </div>
            `;
          })}
      </div>
      <div class="file-input">
        <label class="file-input-label">
          + Add attachment
          <input type="file" multiple @change="${this._handleFileSelect}" />
        </label>
      </div>
    `;
  }
}
