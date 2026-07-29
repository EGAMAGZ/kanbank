import { LitElement } from "lit";
import { PageController } from "@open-cells/page-controller";
export declare class BoardListPage extends LitElement {
  pageController: PageController;
  private boards;
  private showCreateForm;
  private newTitle;
  private newDescription;
  private activityEvents;
  private _pollTimer;
  static styles: import("lit").CSSResult;
  connectedCallback(): Promise<void>;
  disconnectedCallback(): void;
  private loadBoards;
  private getCardColor;
  private handleCreate;
  private handleDelete;
  private navigateToBoard;
  private _groupEventsByType;
  render(): import("lit").TemplateResult<1>;
}
