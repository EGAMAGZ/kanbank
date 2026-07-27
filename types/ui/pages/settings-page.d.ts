import { LitElement } from "lit";
import { PageController } from "@open-cells/page-controller";
export declare class SettingsPage extends LitElement {
    pageController: PageController;
    private discardDaysInput;
    private discardEnabled;
    private saved;
    static styles: import("lit").CSSResult;
    connectedCallback(): void;
    private handleToggleDiscard;
    private handleSave;
    render(): import("lit").TemplateResult<1>;
}
