import { css, html, LitElement } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

type Cmd = [string, string?, string?];

const TOOLBAR_ITEMS: { icon: string; title: string; cmd: Cmd; key?: string }[] =
  [
    { icon: "B", title: "Bold", cmd: ["bold"], key: "B" },
    { icon: "I", title: "Italic", cmd: ["italic"], key: "I" },
    { icon: "S", title: "Strikethrough", cmd: ["strikeThrough"] },
    { icon: "U", title: "Underline", cmd: ["underline"], key: "U" },
    { icon: "H", title: "Highlight", cmd: ["hiliteColor", "#FFE600"] },
    { icon: "🔗", title: "Link", cmd: ["createLink", ""] },
    { icon: "❝", title: "Blockquote", cmd: ["formatBlock", "<blockquote>"] },
    { icon: "</>", title: "Code block", cmd: ["formatBlock", "<pre>"] },
    { icon: "•", title: "Bullet list", cmd: ["insertUnorderedList"] },
    { icon: "1.", title: "Numbered list", cmd: ["insertOrderedList"] },
    {
      icon: "⊞",
      title: "Table",
      cmd: [
        "insertHTML",
        "<table border='1'><tr><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr></table>",
      ],
    },
    { icon: "◀", title: "Align left", cmd: ["justifyLeft"] },
    { icon: "≡", title: "Align center", cmd: ["justifyCenter"] },
    { icon: "▶", title: "Align right", cmd: ["justifyRight"] },
  ];

@customElement("wysiwyg-editor")
export class WysiwygEditor extends LitElement {
  @property({ type: String })
  value = "";

  @property({ type: String })
  placeholder = "Write something...";

  @property({ type: Number })
  minHeight = 120;

  @state()
  private activeCmds = new Set<string>();

  @query(".editor-content")
  private editorEl!: HTMLElement;

  static styles = css`
    :host {
      display: block;
      border: 4px solid var(--color-black);
      background: var(--color-white);
    }

    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 2px;
      padding: var(--space-xs);
      border-bottom: 3px solid var(--color-black);
      background: var(--color-bg);
    }

    .toolbar-btn {
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--color-black);
      background: var(--color-white);
      cursor: pointer;
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 700;
      padding: 0;
      transition: background var(--ease-brutal), color var(--ease-brutal);
    }

    .toolbar-btn:hover {
      background: var(--color-bg);
    }

    .toolbar-btn.active {
      background: var(--color-black);
      color: var(--color-white);
    }

    .toolbar-spacer {
      width: 2px;
      background: var(--color-black);
      margin: 0 var(--space-xs);
    }

    .editor-content {
      padding: var(--space-md);
      min-height: 120px;
      outline: none;
      font-family: var(--font-body);
      font-size: var(--text-base);
      line-height: var(--leading-loose);
      overflow-y: auto;
    }

    .editor-content:empty::before {
      content: attr(data-placeholder);
      color: var(--color-text-3);
      pointer-events: none;
    }

    .editor-content :is(h1, h2, h3, h4) {
      font-family: var(--font-display);
      font-weight: 800;
    }

    .editor-content blockquote {
      border-left: 4px solid var(--color-black);
      padding-left: var(--space-md);
      margin: var(--space-sm) 0;
      color: var(--color-text-2);
    }

    .editor-content pre {
      border: 2px solid var(--color-black);
      padding: var(--space-sm);
      background: var(--color-bg);
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      overflow-x: auto;
    }

    .editor-content table {
      border-collapse: collapse;
      margin: var(--space-sm) 0;
    }

    .editor-content td {
      border: 2px solid var(--color-black);
      padding: var(--space-xs) var(--space-sm);
      min-width: 40px;
    }
  `;

  firstUpdated(): void {
    if (this.value) {
      this.editorEl.innerHTML = this.value;
    }
  }

  private _execCmd(cmd: Cmd): void {
    const [command, value] = cmd;
    if (command === "createLink" && !value) {
      const url = prompt("Enter URL:", "https://");
      if (url) document.execCommand(command, false, url);
      return;
    }
    if (command === "insertHTML" && value) {
      document.execCommand(command, false, value);
      this._checkActive();
      this._emitChange();
      return;
    }
    document.execCommand(command, false, value);
    this._checkActive();
    this._emitChange();
    this.editorEl.focus();
  }

  private _checkActive(): void {
    const cmds = [
      "bold",
      "italic",
      "strikeThrough",
      "underline",
      "insertUnorderedList",
      "insertOrderedList",
    ];
    const active = new Set<string>();
    for (const cmd of cmds) {
      if (document.queryCommandState(cmd)) active.add(cmd);
    }
    this.activeCmds = active;
  }

  private _emitChange(): void {
    const html = this.editorEl.innerHTML;
    this.dispatchEvent(
      new CustomEvent("editor-change", {
        detail: { html },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _handleInput(): void {
    this._emitChange();
  }

  private _handleKeydown(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key === "b") {
      e.preventDefault();
      this._execCmd(["bold"]);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "i") {
      e.preventDefault();
      this._execCmd(["italic"]);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "u") {
      e.preventDefault();
      this._execCmd(["underline"]);
    }
  }

  setValue(html: string): void {
    if (this.editorEl) {
      this.editorEl.innerHTML = html;
    }
    this.value = html;
  }

  render() {
    const spacer = (i: number) => {
      if (i === 4 || i === 6 || i === 9) {
        return html`<div class="toolbar-spacer"></div>`;
      }
      return "";
    };

    return html`
      <div class="toolbar">
        ${TOOLBAR_ITEMS.map((item, i) =>
          html`
            ${spacer(i)}
            <button
              class="toolbar-btn ${this.activeCmds.has(item.cmd[0])
                ? "active"
                : ""}"
              @click="${() => this._execCmd(item.cmd)}"
              title="${item.title}${item.key ? ` (Ctrl+${item.key})` : ""}"
            >${item.icon}</button>
          `
        )}
      </div>
      <div
        class="editor-content"
        contenteditable="true"
        data-placeholder="${this.placeholder}"
        @input="${this._handleInput}"
        @keydown="${this._handleKeydown}"
        @mouseup="${this._checkActive}"
        @keyup="${this._checkActive}"
      ></div>
    `;
  }
}
