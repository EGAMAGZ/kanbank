import { LitElement } from "lit";
import type { ImageRef } from "../../domain/value-objects/image-ref.js";
export declare class ImageGallery extends LitElement {
    images: ImageRef[];
    deletable: boolean;
    private urls;
    private previewUrl;
    static styles: import("lit").CSSResult;
    updated(changed: Map<string, unknown>): Promise<void>;
    disconnectedCallback(): void;
    private loadImages;
    private revokeAll;
    private openPreview;
    private closePreview;
    private handleRemove;
    render(): import("lit").TemplateResult<1>;
}
