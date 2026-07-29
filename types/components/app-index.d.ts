import { LitElement } from "lit";
import { ElementController } from "@open-cells/element-controller";
import "../ui/components/keycap.js";
import "../ui/components/pinned-stack.js";
import "../ui/components/jump-menu.js";
export declare class AppIndex extends LitElement {
  elementController: ElementController;
  static styles: import("lit").CSSResult;
  constructor();
  private _cmdBarEl;
  private _jumpMenuEl;
  connectedCallback(): void;
  disconnectedCallback(): void;
  private _handleGlobalKeydown;
  private _handleOpenCmdBar;
  private _openCommandBar;
  private _openJumpMenu;
  private _openPinned;
  render(): import("lit").TemplateResult<1>;
}
