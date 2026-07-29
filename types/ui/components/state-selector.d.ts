import { LitElement } from "lit";
import type { State } from "../../domain/entities/state.entity.js";
export declare class StateSelector extends LitElement {
  states: State[];
  activeStateId: string;
  private focusedIndex;
  static styles: import("lit").CSSResult;
  private _selectState;
  private _handleKeydown;
  render(): import("lit").TemplateResult<1>;
}
