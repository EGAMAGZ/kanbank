import { RouteDefinition } from "@open-cells/core/types";

export const routes: RouteDefinition[] = [
  {
    path: "/",
    name: "home",
    component: "board-list-page",
    action: async () => {
      await import("../ui/pages/board-list-page.js");
    },
  },
  {
    path: "/board/:id",
    name: "board-detail",
    component: "board-detail-page",
    action: async () => {
      await import("../ui/pages/board-detail-page.js");
    },
  },
  {
    path: "/task/:id",
    name: "task-detail",
    component: "task-detail-page",
    action: async () => {
      await import("../ui/pages/task-detail-page.js");
    },
  },
  {
    path: "/settings",
    name: "settings",
    component: "settings-page",
    action: async () => {
      await import("../ui/pages/settings-page.js");
    },
  },
];
