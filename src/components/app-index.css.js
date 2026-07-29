import { css } from "lit";

export const styles = css`
  :host {
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
  }

  nav {
    padding: var(--space-md) var(--gutter-lg);
    display: flex;
    gap: var(--space-md);
    align-items: center;
    flex-shrink: 0;
    border-bottom: var(--line-thicker) solid var(--color-black);
    background: var(--color-white);
  }

  .logo {
    font-family: var(--font-display);
    font-weight: 900;
    font-size: var(--text-xl);
    letter-spacing: -0.04em;
    cursor: pointer;
    color: var(--color-black);
    border-right: var(--line-thick) solid var(--color-black);
    padding-right: var(--space-md);
    transition: none;
  }

  .logo:hover {
    text-decoration: none;
    color: var(--color-accent);
  }

  .nav-link {
    font-size: var(--text-sm);
    color: var(--color-text-2);
    cursor: pointer;
    font-weight: 700;
    transition: none;
    padding: var(--space-xs) var(--space-sm);
    border: var(--line-thick) solid transparent;
  }

  .nav-link:hover {
    color: var(--color-text);
    border-color: var(--color-black);
    text-decoration: none;
  }

  .nav-right {
    margin-left: auto;
    display: flex;
    gap: var(--space-sm);
    align-items: center;
  }

  .cmd-hint {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--color-text-3);
    border: var(--line-thick) solid var(--color-black);
    padding: 2px var(--space-sm);
    background: var(--color-bg);
    cursor: pointer;
    transition: background var(--ease-brutal);
  }

  .cmd-hint:hover {
    background: var(--color-black);
    color: var(--color-white);
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
