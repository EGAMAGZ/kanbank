import { css, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";

@customElement("auto-close-dial")
export class AutoCloseDial extends LitElement {
  @state()
  private value = 7;
  @state()
  private enabled = false;

  static styles = css`
    :host {
      display: inline-block;
    }

    .dial-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-md);
    }

    .dial-container {
      position: relative;
      width: 140px;
      height: 140px;
      border: var(--line-thicker) solid var(--color-black);
      border-radius: 50%;
      background: var(--color-white);
      cursor: pointer;
      user-select: none;
    }

    .tick {
      position: absolute;
      width: 3px;
      height: 12px;
      background: var(--color-black);
      top: 4px;
      left: 50%;
      transform-origin: 50% 66px;
      margin-left: -1.5px;
    }

    .tick.major {
      height: 18px;
      width: 4px;
    }

    .tick-label {
      position: absolute;
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      font-weight: 700;
      color: var(--color-text);
      top: 20px;
      left: 50%;
      transform-origin: 50% 50px;
      margin-left: -8px;
      width: 16px;
      text-align: center;
    }

    .needle {
      position: absolute;
      top: 10px;
      left: 50%;
      width: 5px;
      height: 58px;
      background: var(--color-error);
      transform-origin: 50% 60px;
      margin-left: -2.5px;
      border: 2px solid var(--color-black);
      transition: transform 0.2s ease-out;
      z-index: 2;
    }

    .needle::after {
      content: "";
      position: absolute;
      top: -4px;
      left: 50%;
      width: 14px;
      height: 14px;
      border: 2px solid var(--color-black);
      background: var(--color-black);
      border-radius: 50%;
      transform: translate(-50%, 0);
    }

    .center-dot {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 12px;
      height: 12px;
      border: 2px solid var(--color-black);
      background: var(--color-white);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      z-index: 3;
    }

    .dial-value {
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      font-weight: 700;
      border: var(--line-thick) solid var(--color-black);
      padding: var(--space-xs) var(--space-md);
      text-align: center;
    }

    .dial-toggle {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
    }

    .toggle-label {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      font-weight: 700;
      text-transform: uppercase;
    }

    .toggle-switch {
      position: relative;
      width: 44px;
      height: 24px;
      border: var(--line-thick) solid var(--color-black);
      background: var(--color-white);
      cursor: pointer;
      transition: background var(--ease-brutal);
    }

    .toggle-switch.active {
      background: var(--color-accent);
    }

    .toggle-knob {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 16px;
      height: 16px;
      background: var(--color-white);
      border: 2px solid var(--color-black);
      transition: left 0.15s ease-out;
    }

    .toggle-switch.active .toggle-knob {
      left: 22px;
    }
  `;

  private _maxValue = 30;
  private _ticks: { deg: number; label: string; major: boolean }[] = [];

  connectedCallback(): void {
    super.connectedCallback();
    this._buildTicks();
    this._loadValue();
  }

  private _buildTicks(): void {
    this._ticks = [];
    for (let i = 0; i <= this._maxValue; i++) {
      if (i % 5 === 0) {
        const deg = this._valueToDeg(i);
        this._ticks.push({ deg, label: String(i), major: true });
      }
    }
  }

  private _valueToDeg(val: number): number {
    return -135 + (val / this._maxValue) * 270;
  }

  private _degToValue(deg: number): number {
    let val = ((deg + 135) / 270) * this._maxValue;
    val = Math.round(val / 5) * 5;
    return Math.max(0, Math.min(this._maxValue, val));
  }

  private _loadValue(): void {
    const raw = localStorage.getItem("kanbank:autoDiscardDays");
    if (raw !== null) {
      const n = Number(raw);
      if (Number.isFinite(n) && n > 0) {
        this.value = n;
        this.enabled = true;
        return;
      }
    }
    this.value = 7;
    this.enabled = false;
  }

  private _saveValue(): void {
    if (this.enabled && this.value > 0) {
      localStorage.setItem("kanbank:autoDiscardDays", String(this.value));
    } else {
      localStorage.removeItem("kanbank:autoDiscardDays");
    }
  }

  private _toggle(): void {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      localStorage.removeItem("kanbank:autoDiscardDays");
    } else {
      this._saveValue();
    }
  }

  private _handleDialClick(e: MouseEvent): void {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    let deg = Math.atan2(dy, dx) * (180 / Math.PI);
    if (deg < -135) deg = -135;
    if (deg > 135) deg = 135;
    const val = this._degToValue(deg);
    this.value = val;
    this.enabled = true;
    this._saveValue();
    this.requestUpdate();
  }

  render() {
    const needleDeg = this._valueToDeg(this.value);
    return html`
      <div class="dial-wrap">
        <div class="dial-container" @click="${this._handleDialClick}">
          ${this._ticks.map(
            (t) => html`
              <div
                class="tick ${t.major ? "major" : ""}"
                style="transform: rotate(${t.deg}deg)"
              ></div>
            `
          )}
          <div
            class="needle"
            style="transform: rotate(${needleDeg}deg)"
          ></div>
          <div class="center-dot"></div>
        </div>
        <div class="dial-value">${this.enabled ? `${this.value} days` : "Off"}</div>
        <div class="dial-toggle">
          <span class="toggle-label">Auto-close</span>
          <div class="toggle-switch ${this.enabled ? "active" : ""}" @click="${this._toggle}">
            <div class="toggle-knob"></div>
          </div>
        </div>
      </div>
    `;
  }
}
