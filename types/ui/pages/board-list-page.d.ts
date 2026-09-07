import { LitElement } from "lit";
import { PageController } from "@open-cells/page-controller";
import "../../ui/components/keycap.js";
export declare class BoardListPage extends LitElement {
    pageController: PageController;
    private boards;
    private showCreateForm;
    private newTitle;
    private selectedIndex;
    private _boundKeydown?;
    private _boardsSub;
    private _openCreateForm;
    static styles: import("lit").CSSResult;
    connectedCallback(): void;
    disconnectedCallback(): void;
    onPageEnter(): Promise<void>;
    protected updated(changedProperties: Map<PropertyKey, unknown>): void;
    private _onKeyDown;
    private getCardColor;
    private handleCreate;
    private _closeCreateForm;
    private handleDelete;
    private navigateToBoard;
    render(): import("lit").TemplateResult<1>;
}
