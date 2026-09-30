/* Kanbank watch service worker.
 * Static file (Vite copies public/ verbatim) so it stays dependency-free.
 * Watched tasks (Task.watch) get a notification when the due date lands on
 * today, or when the task was updated yesterday.
 *
 * ponytail: the date rule below is duplicated from src/shared/utils/watch.ts
 * because a static SW cannot import app modules. If the rule changes, change
 * both. Checked by src/shared/utils/watch.check.ts.
 *
 * Schedule: the page pings { type: "watch-check" } on first open and every
 * hour. The setInterval below is a best-effort backstop while the SW stays
 * alive; repeated notifications share a tag so they replace, never stack.
 */

const CHECK_INTERVAL_MS = 60 * 60 * 1000;

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      await check();
      setInterval(check, CHECK_INTERVAL_MS);
    })(),
  );
});

self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "watch-check") check();
});

self.addEventListener("notificationclick", (e) => {
  const taskId = e.notification.data && e.notification.data.taskId;
  e.notification.close();
  e.waitUntil(
    (async () => {
      const list = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const client = list[0];
      if (!client) return self.clients.openWindow("./");
      await client.focus();
      if (taskId) client.postMessage({ type: "open-task", id: taskId });
    })(),
  );
});

function pad(n) {
  return String(n).padStart(2, "0");
}

function localDay(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function asLocalDate(dateStr) {
  return dateStr.includes("T")
    ? new Date(dateStr)
    : new Date(`${dateStr}T12:00:00`);
}

function alertsFor(task, now) {
  const alerts = [];
  if (task.dueDate && localDay(asLocalDate(task.dueDate)) === localDay(now)) {
    alerts.push("due today");
  }
  const yesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
  );
  if (localDay(new Date(task.updatedAt)) === localDay(yesterday)) {
    alerts.push("updated yesterday");
  }
  return alerts;
}

function readTasks() {
  return new Promise((resolve) => {
    let req;
    try {
      req = indexedDB.open("KanbankDB");
    } catch (err) {
      return resolve([]);
    }
    req.onerror = () => resolve([]);
    req.onsuccess = () => {
      const database = req.result;
      try {
        const getAll = database
          .transaction("tasks", "readonly")
          .objectStore("tasks")
          .getAll();
        getAll.onsuccess = () => resolve(getAll.result || []);
        getAll.onerror = () => resolve([]);
      } catch (err) {
        resolve([]);
      }
    };
  });
}

async function check() {
  if (self.Notification && self.Notification.permission !== "granted") return;
  const now = new Date();
  const tasks = (await readTasks()).filter((t) => t.watch === true);
  const hits = [];
  for (const task of tasks) {
    const alerts = alertsFor(task, now);
    if (alerts.length === 0) continue;
    hits.push({ task, alerts });
  }
  if (hits.length === 0) return;

  const first = hits[0];
  const rest = hits.length - 1;
  await self.registration.showNotification(
    first.task.title,
    {
      body: first.alerts.join(" · ") + (rest ? ` (+${rest} more watched)` : ""),
      tag: "kanbank-watch",
      data: { taskId: first.task.id },
    },
  );
}
