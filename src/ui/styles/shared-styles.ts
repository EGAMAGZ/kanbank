import { css } from 'lit';

export const brutalCard = css`
  border: 2px solid #000;
  box-shadow: 4px 4px 0 #000;
`;

export const brutalCardLg = css`
  border: 2px solid #000;
  box-shadow: 6px 6px 0 #000;
`;

export const brutalButton = css`
  padding: var(--space-sm, 8px) var(--space-md, 16px);
  border: 2px solid #000;
  box-shadow: 4px 4px 0 #000;
  background: var(--color-accent, #2563EB);
  color: #fff;
  font-family: var(--font-body, 'Space Grotesk', sans-serif);
  font-size: var(--text-sm, 0.875rem);
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
`;

export const brutalButtonHover = css`
  :host(:hover) {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 #000;
  }
`;

export const brutalInput = css`
  padding: var(--space-sm, 8px) var(--space-md, 16px);
  border: 2px solid #000;
  background: #fff;
  font-family: var(--font-body, 'Space Grotesk', sans-serif);
  font-size: var(--text-sm, 0.875rem);
  outline: none;
`;

export const brutalInputFocus = css`
  :host(:focus-within) {
    box-shadow: 2px 2px 0 var(--color-accent, #2563EB);
  }
`;

export const headingDisplay = css`
  font-family: var(--font-display, 'Space Grotesk', sans-serif);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.2;
  color: var(--color-text, #0A0A0A);
`;

export const textMuted = css`
  color: var(--color-text-2, #6B7280);
`;

export const textSmall = css`
  font-size: var(--text-sm, 0.875rem);
`;
