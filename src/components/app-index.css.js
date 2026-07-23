import { css } from 'lit';

export const styles = css`
  :host {
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
  }

  nav {
    padding: var(--space-lg) var(--space-xl);
    border-bottom: 2px solid #000;
    display: flex;
    gap: var(--space-lg);
    align-items: center;
    flex-shrink: 0;
  }

  .logo {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: var(--text-xl);
    letter-spacing: -0.04em;
    cursor: pointer;
    color: var(--color-text);
  }

  .logo:hover {
    color: var(--color-accent);
  }

  .nav-link {
    font-size: var(--text-sm);
    color: var(--color-text-2);
    cursor: pointer;
    font-weight: 500;
  }

  .nav-link:hover {
    color: var(--color-text);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  main {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  main ::slotted(*) {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    visibility: hidden;
  }

  main ::slotted([state="active"]) {
    visibility: visible;
  }
`;
