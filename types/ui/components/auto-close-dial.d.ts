import { LitElement } from "lit";
export declare class AutoCloseDial extends LitElement {
    private value;
    private enabled;
    static styles: import("lit").CSSResult;
    private _maxValue;
    private _ticks;
    connectedCallback(): void;
    private _buildTicks;
    private _valueToDeg;
    private _degToValue;
    private _loadValue;
    private _saveValue;
    private _toggle;
    private _handleDialClick;
    render(): import("lit").TemplateResult<1>;
}
