import { LitElement } from "lit";
export declare class ActivityFeed extends LitElement {
  stateTitles: Record<string, string>;
  taskTitles: Record<string, string>;
  private events;
  private _pollTimer;
  static styles: import("lit").CSSResult;
  connectedCallback(): void;
  disconnectedCallback(): void;
  private _poll;
  private _formatEvent;
  render(): import("lit").TemplateResult<1>;
}
