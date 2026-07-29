import { LitElement } from "lit";
import { ElementController } from "@open-cells/element-controller";
export declare class AppIndex extends LitElement {
    elementController: ElementController;
    static styles: import("lit").CSSResult;
    constructor();
    private _cmdBarEl;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private _handleGlobalKeydown;
    private _handleOpenCmdBar;
    private _openCommandBar;
    render(): import("lit").TemplateResult<1>;
}
