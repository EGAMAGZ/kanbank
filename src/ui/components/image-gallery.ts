import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { ImageRef } from "../../domain/value-objects/image-ref.js";
import { DexieImageRepository } from "../../infrastructure/storage/image-storage.service.js";

const imageRepo = new DexieImageRepository();

@customElement("image-gallery")
export class ImageGallery extends LitElement {
  @property({ type: Array })
  images: ImageRef[] = [];
  @property({ type: Boolean })
  deletable = false;
  @state()
  private urls: Map<string, string> = new Map();
  @state()
  private previewUrl: string | null = null;

  static styles = css`
    :host {
      display: block;
    }
    .grid {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-sm);
      margin-top: var(--space-sm);
    }
    .thumb-wrap {
      position: relative;
      width: 80px;
      height: 80px;
      overflow: hidden;
      border: 2px solid #000;
      cursor: pointer;
      flex-shrink: 0;
      transition: box-shadow 0.1s;
    }
    .thumb-wrap:hover {
      box-shadow: 3px 3px 0 #000;
    }
    .thumb-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .thumb-wrap .remove {
      position: absolute;
      top: 2px;
      right: 2px;
      width: 18px;
      height: 18px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      border: none;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.15s;
    }
    .thumb-wrap:hover .remove {
      opacity: 1;
    }
    .preview-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
      cursor: pointer;
    }
    .preview-overlay img {
      max-width: 90vw;
      max-height: 90vh;
      border: 2px solid #000;
      box-shadow: 8px 8px 0 #000;
    }
  `;

  async updated(changed: Map<string, unknown>): Promise<void> {
    if (changed.has("images")) {
      await this.loadImages();
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.revokeAll();
  }

  private async loadImages(): Promise<void> {
    this.revokeAll();
    const newUrls = new Map<string, string>();
    for (const img of this.images) {
      const blob = await imageRepo.get(img.id);
      if (blob) {
        newUrls.set(img.id, URL.createObjectURL(blob));
      }
    }
    this.urls = newUrls;
  }

  private revokeAll(): void {
    for (const url of this.urls.values()) {
      URL.revokeObjectURL(url);
    }
    this.urls = new Map();
  }

  private openPreview(url: string): void {
    this.previewUrl = url;
  }

  private closePreview(): void {
    this.previewUrl = null;
  }

  private handleRemove(e: Event, img: ImageRef): void {
    e.stopPropagation();
    if (confirm("Remove this image?")) {
      this.dispatchEvent(
        new CustomEvent("image-removed", {
          detail: { imageId: img.id },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  render() {
    if (!this.images.length) return html``;
    return html`
      <div class="grid">
        ${this.images.map((img) => {
          const url = this.urls.get(img.id);
          return url
            ? html`
              <div class="thumb-wrap" @click="${() => this.openPreview(url)}">
                <img src="${url}" alt="${img.filename}" />
                ${this.deletable
                  ? html`<button class="remove" @click="${(e: Event) =>
                    this.handleRemove(e, img)}">&times;</button>`
                  : ""}
              </div>
            `
            : html``;
        })}
      </div>
      ${this.previewUrl
        ? html`
          <div class="preview-overlay" @click="${this.closePreview}">
            <img src="${this.previewUrl}" @click="${(e: Event) =>
              e.stopPropagation()}" />
          </div>
        `
        : ""}
    `;
  }
}
