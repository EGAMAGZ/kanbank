import { LitElement } from "lit";
import { PageController } from "@open-cells/page-controller";
import "../../ui/components/auto-close-dial.js";
export declare class SettingsPage extends LitElement {
    pageController: PageController;
    private boards;
    private selectedBoardId;
    private selectedBoard;
    private autoCloseDays;
    private autoCloseEnabled;
    static styles: import("lit").CSSResult;
    connectedCallback(): Promise<void>;
    private _loadBoardSettings;
    private _handleBoardSelect;
    private _handleDialChange;
    private _saveSettings;
    render(): import("lit").TemplateResult<1>;
}
