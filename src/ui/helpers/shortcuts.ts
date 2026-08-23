export function isMac(): boolean {
  const ua = navigator.userAgent;
  return (
    /Mac|iPhone|iPad|iPod/i.test(ua) ||
    navigator.platform.toUpperCase().includes("MAC")
  );
}

export function mod(e: KeyboardEvent): boolean {
  return e.metaKey || e.ctrlKey;
}

export function isEditableTarget(e: Event): boolean {
  const path = typeof e.composedPath === "function" ? e.composedPath() : [];
  const target = (path[0] ?? e.target) as HTMLElement | null;
  if (!target) return false;
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) {
    return true;
  }
  return target.isContentEditable === true;
}

function parseKeycap(key: string): {
  mod: boolean;
  alt: boolean;
  shift: boolean;
  rest: string;
} {
  let modFlag = false;
  let altFlag = false;
  let shiftFlag = false;
  let rest = "";
  for (const ch of key) {
    if (ch === "⌘" || ch === "^") {
      modFlag = true;
    } else if (ch === "⎇") {
      altFlag = true;
    } else if (ch === "⇧") {
      shiftFlag = true;
    } else {
      rest += ch;
    }
  }
  return { mod: modFlag, alt: altFlag, shift: shiftFlag, rest };
}

export function keycapLabel(key: string): string {
  const { mod: modFlag, alt, shift, rest } = parseKeycap(key);
  const letter = rest.toUpperCase();
  if (isMac()) {
    let label = "";
    if (modFlag) label += "⌘";
    if (alt) label += "⌥";
    if (shift) label += "⇧";
    return `${label}${letter}`;
  }
  const parts: string[] = [];
  if (modFlag) parts.push("Ctrl");
  if (alt) parts.push("Alt");
  if (shift) parts.push("Shift");
  parts.push(letter);
  return parts.join("+");
}
