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
import { initApp } from "../infrastructure/initialization/app-init.js";
import { initChannelBridge } from "../ui/events/channel-bridge.js";

const boardRepo = new DexieBoardRepository();
const stateRepo = new DexieStateRepository();
const taskRepo = new DexieTaskRepository();
const commentRepo = new DexieCommentRepository();
const imageRepo = new DexieImageRepository();

initApp({ boardRepo, stateRepo, taskRepo, commentRepo, imageRepo });

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

  render() {
    return html`
      <nav>
        <strong class="logo" @click="${() =>
          this.elementController.navigate("home")}">Kanbank</strong>
        <span class="nav-link" @click="${() =>
          this.elementController.navigate("settings")}">Settings</span>
      </nav>
      <main role="main" tabindex="-1">
        <slot></slot>
      </main>
    `;
  }
}
