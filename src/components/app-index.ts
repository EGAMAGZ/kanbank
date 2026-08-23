import { startApp } from "@open-cells/core";
import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import { ElementController } from "@open-cells/element-controller";
import { routes } from "../router/routes.js";
import { styles } from "./app-index.css.js";
import { DexieBoardRepository } from "../infrastructure/repositories/dexie-board.repository.js";
import { DexieStateRepository } from "../infrastructure/repositories/dexie-state.repository.js";
import { DexieTaskRepository } from "../infrastructure/repositories/dexie-task.repository.js";
import { DexieCommentRepository } from "../infrastructure/repositories/dexie-comment.repository.js";
import { DexieImageRepository } from "../infrastructure/storage/image-storage.service.js";
import { DexieStepRepository } from "../infrastructure/repositories/dexie-step.repository.js";
import { DexieTimelineRepository } from "../infrastructure/repositories/dexie-timeline.repository.js";
import { initApp } from "../infrastructure/initialization/app-init.js";
import { initChannelBridge } from "../ui/events/channel-bridge.js";
import "../ui/components/keycap.js";
import "../ui/components/pinned-stack.js";
import "../ui/components/jump-menu.js";
import { isEditableTarget, mod } from "../ui/helpers/shortcuts.js";

const boardRepo = new DexieBoardRepository();
const stateRepo = new DexieStateRepository();
const taskRepo = new DexieTaskRepository();
const commentRepo = new DexieCommentRepository();
const imageRepo = new DexieImageRepository();
const stepRepo = new DexieStepRepository();
const timelineRepo = new DexieTimelineRepository();

initApp({
  boardRepo,
  stateRepo,
  taskRepo,
  commentRepo,
  imageRepo,
  stepRepo,
  timelineRepo,
});

startApp({
  routes,
  mainNode: "app-content",
});

@customElement("app-index")
export class AppIndex extends LitElement {
  elementController = new ElementController(this);

  static styles = styles;

  constructor() {
    super();
    initChannelBridge((channel, value) => {
      this.elementController.publish(channel, value);
    });
  }

  private _cmdBarEl: HTMLElement | null = null;
  private _jumpMenuEl: HTMLElement | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("keydown", this._handleGlobalKeydown);
    window.addEventListener("open-command-bar", this._handleOpenCmdBar);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this._handleGlobalKeydown);
    window.removeEventListener("open-command-bar", this._handleOpenCmdBar);
  }

  private _handleGlobalKeydown = (e: KeyboardEvent): void => {
    if (isEditableTarget(e)) return;

    if (
      e.code === "Digit1" && !mod(e) && !e.altKey && !e.shiftKey
    ) {
      e.preventDefault();
      this.elementController.navigate("home");
      return;
    }

    if (e.code === "KeyK" && !e.shiftKey) {
      e.preventDefault();
      this._openCommandBar();
      return;
    }

    if (e.code === "KeyN" && !mod(e) && !e.shiftKey) {
      e.preventDefault();
      this.elementController.navigate("settings");
      return;
    }

    if (e.code === "KeyJ") {
      e.preventDefault();
      this._openJumpMenu();
      return;
    }

    if (e.code === "KeyB" && !mod(e) && !e.shiftKey) {
      e.preventDefault();
      this.elementController.navigate("home");
      setTimeout(
        () => window.dispatchEvent(new CustomEvent("create-board")),
        150,
      );
      return;
    }
  };

  private _handleOpenCmdBar = (): void => {
    this._openCommandBar();
  };

  private _openCommandBar(): void {
    if (this._cmdBarEl?.isConnected) return;
    import("../ui/components/command-bar.js").then(() => {
      this._cmdBarEl = document.createElement("command-bar");
      document.body.appendChild(this._cmdBarEl);
    });
  }

  private _openJumpMenu(): void {
    if (this._jumpMenuEl?.isConnected) return;
    this._jumpMenuEl = document.createElement("jump-menu");
    this._jumpMenuEl.addEventListener("jump-close", () => {
      this._jumpMenuEl?.remove();
      this._jumpMenuEl = null;
    });
    document.body.appendChild(this._jumpMenuEl);
  }

  private _openPinned(): void {
    const pinned = document.querySelector("pinned-stack");
    if (pinned) {
      (pinned as any)._toggle?.();
    }
  }

  render() {
    return html`
      <nav>
        <strong class="logo" @click="${() =>
          this.elementController.navigate("home")}">◆ KANBANK</strong>
        <span class="nav-link"
          @click="${() =>
            this.elementController.navigate(
              "home",
            )}">Home <keycap-el key="1"></keycap-el></span>
        <span class="nav-link"
          @click="${() =>
            this.elementController.navigate(
              "settings",
            )}">Settings <keycap-el key="N"></keycap-el></span>
        <div class="nav-right">
          <span class="cmd-hint"
            @click="${this
              ._openJumpMenu}">Jump <keycap-el key="J"></keycap-el></span>
          <span class="cmd-hint"
            @click="${this
              ._openPinned}">Pinned <keycap-el key="P"></keycap-el></span>
          <span class="cmd-hint"
            @click="${this
              ._openCommandBar}"><keycap-el key="K"></keycap-el></span>
        </div>
      </nav>
      <main role="main" tabindex="-1">
        <slot></slot>
      </main>
      <pinned-stack></pinned-stack>
    `;
  }
}
