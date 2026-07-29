import { LitElement } from "lit";
import type { Task } from "../../domain/entities/task.entity.js";
export declare const CURRENT_USER: {
  name: string;
  initials: string;
};
export declare class TaskCard extends LitElement {
  task: Task;
  index: number;
  columnColor: string;
  static styles: import("lit").CSSResult;
  render(): import("lit").TemplateResult<1>;
}
