import { LitElement } from 'lit';
import type { Board } from '../../domain/entities/board.entity.js';
export declare class BoardCard extends LitElement {
    board: Board;
    static styles: import("lit").CSSResult;
    protected createRenderRoot(): HTMLElement | DocumentFragment;
    render(): import("lit").TemplateResult<1>;
}
