import { LitElement } from 'lit';
export declare class TaskEditor extends LitElement {
    stateId: string;
    private taskTitle;
    static styles: import("lit").CSSResult;
    protected createRenderRoot(): HTMLElement | DocumentFragment;
    private handleSubmit;
    render(): import("lit").TemplateResult<1>;
}
