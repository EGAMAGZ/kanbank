import { css, html, type TemplateResult } from "lit";

export const iconStyle = css`
  .icon {
    font-family: "Material Icons";
    font-weight: normal;
    font-style: normal;
    font-size: 1em;
    line-height: 1;
    letter-spacing: normal;
    text-transform: none;
    display: inline-block;
    white-space: nowrap;
    word-wrap: normal;
    direction: ltr;
    -webkit-font-feature-settings: "liga";
    -webkit-font-smoothing: antialiased;
    user-select: none;
  }
`;

export const icon = (name: string): TemplateResult =>
  html`<span class="icon">${name}</span>`;
