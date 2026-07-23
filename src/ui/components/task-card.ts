import { html, LitElement, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Task } from '../../domain/entities/task.entity.js';
import { inactiveDays } from '../../shared/utils/dates.js';

@customElement('task-card')
export class TaskCard extends LitElement {
  @property({ type: Object }) task!: Task;

  static styles = css`
    :host {
      display: block; background: white; border: 1px solid #ddd; border-radius: 6px;
      padding: 10px; margin-bottom: 8px; cursor: grab; transition: box-shadow 0.2s;
    }
    :host(:active) { cursor: grabbing; }
    :host(:hover) { box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
    .title { font-size: 14px; margin-bottom: 4px; }
    .inactive { font-size: 12px; color: #999; }
    .inactive.stale { color: #cc6600; }
  `;

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  render() {
    const days = inactiveDays(this.task.lastActivityAt);
    return html`
      <div class="title">${this.task.title}</div>
      ${days > 0 ? html`<div class="inactive ${days > 7 ? 'stale' : ''}">${days}d inactive</div>` : ''}
    `;
  }
}
