import { LitElement } from "lit";
export declare class WysiwygEditor extends LitElement {
  value: string;
  placeholder: string;
  minHeight: number;
  private activeCmds;
  private editorEl;
  static styles: import("lit").CSSResult;
  firstUpdated(): void;
  private _execCmd;
  private _checkActive;
  private _emitChange;
  private _handleInput;
  private _handleKeydown;
  setValue(html: string): void;
  render(): import("lit").TemplateResult<1>;
}
