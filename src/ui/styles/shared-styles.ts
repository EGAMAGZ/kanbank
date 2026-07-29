import { css } from "lit";

export const brutalCard = css`
  border: var(--line-thick) solid var(--color-black);
  box-shadow: var(--shadow-brutal);
  background: var(--color-white);
`;

export const brutalCardLg = css`
  border: var(--line-thick) solid var(--color-black);
  box-shadow: var(--shadow-brutal-md);
  background: var(--color-white);
`;

export const brutalButton = css`
  padding: var(--space-sm) var(--space-md);
  border: var(--line-thick) solid var(--color-black);
  box-shadow: var(--shadow-brutal);
  background: var(--color-accent);
  color: var(--color-white);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 700;
  cursor: pointer;
  transition: transform var(--ease-brutal), box-shadow var(--ease-brutal);
`;

export const brutalButtonHover = css`
  :host(:hover) {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 var(--color-black);
  }
`;

export const brutalInput = css`
  padding: var(--space-sm) var(--space-md);
  border: var(--line-thick) solid var(--color-black);
  background: var(--color-white);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  outline: none;
  transition: box-shadow var(--ease-brutal);
`;

export const brutalInputFocus = css`
  :host(:focus-within) {
    box-shadow: 3px 3px 0 var(--color-accent);
  }
`;

export const headingDisplay = css`
  font-family: var(--font-display);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: var(--leading-tight);
  color: var(--color-text);
`;

export const textMuted = css`
  color: var(--color-text-2);
`;

export const fontMono = css`
  font-family: var(--font-mono);
`;
