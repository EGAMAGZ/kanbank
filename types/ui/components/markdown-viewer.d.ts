import { LitElement } from 'lit';
export declare class MarkdownViewer extends LitElement {
    content: string;
    static styles: import("lit").CSSResult;
    protected createRenderRoot(): HTMLElement | DocumentFragment;
    private renderMarkdown;
    render(): import("lit").TemplateResult<1>;
}
