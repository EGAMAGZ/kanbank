import { LitElement } from "lit";
import { PageController } from "@open-cells/page-controller";
export declare class BoardListPage extends LitElement {
    pageController: PageController;
    private boards;
    private showCreateForm;
    private newTitle;
    private newDescription;
    static styles: import("lit").CSSResult;
    connectedCallback(): Promise<void>;
    private loadBoards;
    private getCardSpan;
    private getCardColor;
    private handleCreate;
    private handleDelete;
    private navigateToBoard;
    render(): import("lit").TemplateResult<1>;
}
