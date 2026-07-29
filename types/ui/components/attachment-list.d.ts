import { LitElement } from "lit";
import type { ImageRef } from "../../domain/value-objects/image-ref.js";
export declare class AttachmentList extends LitElement {
  images: ImageRef[];
  deletable: boolean;
  private blobs;
  static styles: import("lit").CSSResult;
  connectedCallback(): Promise<void>;
  updated(changed: Map<string, unknown>): void;
  private _loadBlobs;
  disconnectedCallback(): void;
  private _formatSize;
  private _handleDownload;
  private _handleDelete;
  private _handleFileSelect;
  render(): import("lit").TemplateResult<1>;
}
