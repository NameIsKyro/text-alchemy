import type { SortMode } from "./types";
import { normalizeLineEndings, stripListMarker } from "./transforms";

export function sortByMode(text: string, mode: SortMode): string {
  if (mode === "linesAz") {
    return sortLinesAZ(text);
  }

  if (mode === "linesZa") {
    return sortLinesZA(text);
  }

  if (mode === "headingsAz") {
    return sortHeadingsAZ(text);
  }

  if (mode === "titleLinesAz") {
    return sortTitleLinesAZ(text);
  }

  return text;
}

export function sortLinesAZ(text: string): string {
  return normalizeLineEndings(text)
    .split("\n")
    .sort((a, b) => cleanSortKey(a).localeCompare(cleanSortKey(b)))
    .join("\n");
}

export function sortLinesZA(text: string): string {
  return normalizeLineEndings(text)
    .split("\n")
    .sort((a, b) => cleanSortKey(b).localeCompare(cleanSortKey(a)))
    .join("\n");
}

export function sortHeadingsAZ(text: string): string {
  const lines = normalizeLineEndings(text).split("\n");
  const headings = lines.filter(isHeadingLine);
  const nonHeadings = lines.filter((line) => !isHeadingLine(line));
  const sortedHeadings = headings.sort((a, b) => cleanSortKey(a).localeCompare(cleanSortKey(b)));

  return [...sortedHeadings, ...nonHeadings].join("\n");
}

export function sortTitleLinesAZ(text: string): string {
  return normalizeLineEndings(text)
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .sort((a, b) => a.trim().toLowerCase().localeCompare(b.trim().toLowerCase()))
    .join("\n");
}

function isHeadingLine(line: string): boolean {
  return /^#{1,6}\s+/.test(line);
}

function cleanSortKey(line: string): string {
  return stripListMarker(line)
    .replace(/^#{1,6}\s+/, "")
    .trim()
    .toLowerCase();
}
