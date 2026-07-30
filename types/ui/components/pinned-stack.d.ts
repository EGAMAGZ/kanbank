import { LitElement } from "lit";
import { ElementController } from "@open-cells/element-controller";
export declare class PinnedStack extends LitElement {
    elementController: ElementController;
    private expanded;
    private tasks;
    private boards;
    private states;
    private selectedIndex;
    private subscriptions;
    static styles: import("lit").CSSResult;
    connectedCallback(): Promise<void>;
    disconnectedCallback(): void;
    private _onPinnedChanged;
    private _loadData;
    toggle(): void;
    private _toggle;
    private _syncSelection;
    private _moveSelection;
    private _handleKeydown;
    private _navigate;
    private _formatTime;
    render(): import("lit").TemplateResult<1>;
}
