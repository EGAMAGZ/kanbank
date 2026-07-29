import { LitElement } from "lit";
import type { Step } from "../../domain/entities/step.entity.js";
export declare class StepChecklist extends LitElement {
    steps: Step[];
    editable: boolean;
    private newStepText;
    private editingStepId;
    private editingStepText;
    static styles: import("lit").CSSResult;
    private _toggleStep;
    private _startEditStep;
    private _saveEditStep;
    private _deleteStep;
    private _handleAddStep;
    private _handleKeydown;
    private _handleEditKeydown;
    render(): import("lit").TemplateResult<1>;
}
