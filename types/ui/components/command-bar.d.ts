import { LitElement } from "lit";
import { ElementController } from "@open-cells/element-controller";
export declare class CommandBar extends LitElement {
    elementController: ElementController;
    private query;
    private results;
    private selectedIndex;
    private boards;
    private tasks;
    static styles: import("lit").CSSResult;
    connectedCallback(): Promise<void>;
    private _close;
    private _onInput;
    private _updateResults;
    private _handleKeydown;
    private _scrollIntoView;
    private _onBackdropClick;
    render(): import("lit").TemplateResult<1>;
}
