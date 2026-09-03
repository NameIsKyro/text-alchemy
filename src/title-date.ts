import { formatTitleDate } from "./date-suggest";
import type { TextAlchemySettings } from "./types";

const TITLE_SELECTOR = ".inline-title, .view-header-title, .view-header-title-container input";
const updatingTitles = new WeakSet<object>();

export function expandInlineTitleDate(event: Event, settings: TextAlchemySettings, now = new Date()): void {
  if (!settings.titleDateExpansionEnabled) {
    return;
  }

  const title = findTitleElement(event.target);

  if (!title || updatingTitles.has(title)) {
    return;
  }

  const currentText = readTitleText(title);

  if (!/@date\b/i.test(currentText)) {
    return;
  }

  const replacement = formatTitleDate(now, settings, true);
  const nextText = currentText.replace(/@date\b/gi, replacement);

  updatingTitles.add(title);

  try {
    writeTitleText(title, nextText);
    moveCaretToEnd(title);
    dispatchReplacementInput(title);
  } finally {
    updatingTitles.delete(title);
  }
}

function findTitleElement(target: EventTarget | null): HTMLElement | null {
  if (!target || typeof (target as Element).closest !== "function") {
    return null;
  }

  return (target as Element).closest<HTMLElement>(TITLE_SELECTOR);
}

function readTitleText(title: HTMLElement): string {
  if (isInputElement(title)) {
    return title.value;
  }

  return title.textContent ?? "";
}

function writeTitleText(title: HTMLElement, value: string): void {
  if (isInputElement(title)) {
    title.value = value;
    return;
  }

  title.textContent = value;
}

function isInputElement(title: HTMLElement): title is HTMLInputElement {
  return title.tagName === "INPUT";
}

function moveCaretToEnd(title: HTMLElement): void {
  if (isInputElement(title)) {
    const end = title.value.length;
    title.setSelectionRange(end, end);
    return;
  }

  const selection = title.ownerDocument?.defaultView?.getSelection();

  if (!selection || !title.ownerDocument) {
    return;
  }

  const range = title.ownerDocument.createRange();
  range.selectNodeContents(title);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function dispatchReplacementInput(title: HTMLElement): void {
  const EventConstructor = title.ownerDocument?.defaultView?.Event;

  if (!EventConstructor) {
    return;
  }

  title.dispatchEvent(new EventConstructor("input", { bubbles: true }));
}
