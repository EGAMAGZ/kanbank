import { css } from 'lit';

/* Anchor card — the "raw gesture" container.
 * Use max 1-2 per view. Everything else floats free. */
export const brutalCard = css`
  border: 2px solid var(--color-black, #000);
  box-shadow: var(--shadow-brutal, 4px 4px 0 #000);
  background: var(--color-white, #fff);
`;

export const brutalCardLg = css`
  border: 2px solid var(--color-black, #000);
  box-shadow: var(--shadow-brutal-md, 6px 6px 0 #000);
  background: var(--color-white, #fff);
`;

/* Buttons — brutal press-state */
export const brutalButton = css`
  padding: var(--space-sm, 8px) var(--space-md, 16px);
  border: 2px solid var(--color-black, #000);
  box-shadow: var(--shadow-brutal, 4px 4px 0 #000);
  background: var(--color-accent, #2563EB);
  color: #fff;
  font-family: var(--font-body, 'Space Grotesk', sans-serif);
  font-size: var(--text-sm, 0.875rem);
  font-weight: 700;
  cursor: pointer;
  transition: transform var(--ease-brutal, 0.12s),
              box-shadow var(--ease-brutal, 0.12s);
`;

export const brutalButtonHover = css`
  :host(:hover) {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 #000;
  }
`;

/* Inputs */
export const brutalInput = css`
  padding: var(--space-sm, 8px) var(--space-md, 16px);
  border: 2px solid var(--color-black, #000);
  background: var(--color-white, #fff);
  font-family: var(--font-body, 'Space Grotesk', sans-serif);
  font-size: var(--text-sm, 0.875rem);
  outline: none;
  transition: box-shadow var(--ease-brutal, 0.12s);
`;

export const brutalInputFocus = css`
  :host(:focus-within) {
    box-shadow: 2px 2px 0 var(--color-accent, #2563EB);
  }
`;

/* Typography utilities */
export const headingDisplay = css`
  font-family: var(--font-display, 'Space Grotesk', sans-serif);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: var(--leading-tight, 1.1);
  color: var(--color-text, #0A0A0A);
`;

export const textMuted = css`
  color: var(--color-text-2, #6B7280);
`;

export const textSmall = css`
  font-size: var(--text-sm, 0.875rem);
`;
