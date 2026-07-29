import { LitElement } from "lit";
import type { Step } from "../../domain/entities/step.entity.js";
export declare class StepChecklist extends LitElement {
    steps: Step[];
    editable: boolean;
    private newStepText;
    static styles: import("lit").CSSResult;
    private _toggleStep;
    private _deleteStep;
    private _handleAddStep;
    private _handleKeydown;
    render(): import("lit").TemplateResult<1>;
}
