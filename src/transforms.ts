import type { BulletMarker, HeadingLevel } from "./types";

export function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}

export function preserveEdgeNewlines(original: string, transformed: string): string {
  const startsWithNewline = /^\r?\n/.test(original);
  const endsWithNewline = /\r?\n$/.test(original);
  let result = transformed;

  if (startsWithNewline && result.length > 0 && !result.startsWith("\n")) {
    result = `\n${result}`;
  }

  if (endsWithNewline && result.length > 0 && !result.endsWith("\n")) {
    result = `${result}\n`;
  }

  return result;
}

export function removeGapsBetweenLines(text: string): string {
  const lines = normalizeLineEndings(text)
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);

  return preserveEdgeNewlines(text, lines.join("\n"));
}

export function trimLineWhitespace(text: string): string {
  return normalizeLineEndings(text)
    .split("\n")
    .map((line) => line.trim())
    .join("\n");
}

export function removeDuplicatesSoft(text: string): string {
  const { uniqueLines, duplicateLines } = collectUniqueAndDuplicateLines(text);

  if (duplicateLines.length === 0) {
    return uniqueLines.join("\n");
  }

  return `${uniqueLines.join("\n")}\n\nDuplicates:\n${duplicateLines.join("\n")}`;
}

export function removeDuplicatesHard(text: string): string {
  return collectUniqueAndDuplicateLines(text).uniqueLines.join("\n");
}

export function addParagraphSpacing(text: string): string {
  const normalized = normalizeLineEndings(text);
  const trimmed = normalized.trim();

  if (trimmed.length === 0) {
    return "";
  }

  const lines = trimmed.split("\n").map((line) => line.trimEnd());
  const hasExistingBlankLine = lines.some((line) => line.trim().length === 0);

  if (!hasExistingBlankLine) {
    return preserveEdgeNewlines(text, lines.filter((line) => line.trim().length > 0).join("\n\n"));
  }

  const blocks: string[] = [];
  let currentBlock: string[] = [];

  for (const line of lines) {
    if (line.trim().length === 0) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join("\n"));
        currentBlock = [];
      }
      continue;
    }

    currentBlock.push(line);
  }

  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join("\n"));
  }

  return preserveEdgeNewlines(text, blocks.join("\n\n"));
}

export function spaceHeadings(text: string, levels: HeadingLevel[]): string {
  if (levels.length === 0) {
    return text;
  }

  const lines = normalizeLineEndings(text).split("\n").map((line) => line.trimEnd());
  const output: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const level = getHeadingLevel(line);

    if (level !== null && levels.includes(level)) {
      removeTrailingBlankLines(output);

      if (output.length > 0) {
        output.push("");
      }

      output.push(line);

      while (index + 1 < lines.length && isBlank(lines[index + 1])) {
        index += 1;
      }

      if (hasNextNonBlankLine(lines, index + 1)) {
        output.push("");
      }

      continue;
    }

    output.push(line);
  }

  return preserveEdgeNewlines(text, trimExcessEdgeBlankLines(output).join("\n"));
}

export function addDividersBetweenHeadings(text: string, levels: HeadingLevel[], withBlankLines: boolean): string {
  if (levels.length === 0) {
    return text;
  }

  const lines = normalizeLineEndings(text).split("\n").map((line) => line.trimEnd());
  const output: string[] = [];
  let hasSeenMatchingHeading = false;

  for (const line of lines) {
    const level = getHeadingLevel(line);

    if (level !== null && levels.includes(level)) {
      removeTrailingBlankLines(output);

      if (hasSeenMatchingHeading && !previousNonBlankLineIsDivider(output)) {
        if (withBlankLines && output.length > 0) {
          output.push("");
        }

        output.push("---");

        if (withBlankLines) {
          output.push("");
        }
      }

      output.push(line);
      hasSeenMatchingHeading = true;
      continue;
    }

    output.push(line);
  }

  return preserveEdgeNewlines(text, trimExcessEdgeBlankLines(output).join("\n"));
}

export function linesToBulletList(text: string, bulletMarker: BulletMarker): string {
  const lines = normalizeLineEndings(text)
    .split("\n")
    .map(stripListMarker)
    .filter((line) => line.length > 0)
    .map((line) => `${bulletMarker} ${line}`);

  return preserveEdgeNewlines(text, lines.join("\n"));
}

export function linesToNumberedList(text: string, startAt: number): string {
  const start = normalizeStartNumber(startAt);
  const lines = normalizeLineEndings(text)
    .split("\n")
    .map(stripListMarker)
    .filter((line) => line.length > 0)
    .map((line, index) => `${start + index}. ${line}`);

  return preserveEdgeNewlines(text, lines.join("\n"));
}

export function linesToChecklist(text: string): string {
  const lines = normalizeLineEndings(text)
    .split("\n")
    .map(stripListMarker)
    .filter((line) => line.length > 0)
    .map((line) => `- [ ] ${line}`);

  return preserveEdgeNewlines(text, lines.join("\n"));
}

export function removeBulletsAndNumbering(text: string): string {
  const lines = normalizeLineEndings(text)
    .split("\n")
    .map((line) => line.trim().length === 0 ? "" : stripListMarker(line));

  return preserveEdgeNewlines(text, lines.join("\n"));
}

export function renumberNumberedList(text: string, startAt: number): string {
  let number = normalizeStartNumber(startAt);

  const lines = normalizeLineEndings(text)
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();

      if (trimmed.length === 0) {
        return "";
      }

      return `${number++}. ${stripListMarker(line)}`;
    });

  return preserveEdgeNewlines(text, lines.join("\n"));
}

export function cleanWikiLinks(text: string): string {
  const lines = normalizeLineEndings(text)
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      const wikiMatch = trimmed.match(/^\[\[\s*(.*?)\s*\]\]$/);

      if (!wikiMatch) {
        return trimmed;
      }

      return `[[${wikiMatch[1].trim()}]]`;
    });

  return preserveEdgeNewlines(text, lines.join("\n"));
}

export function plainLinesToWikiLinks(text: string): string {
  const lines = normalizeLineEndings(text)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const wikiMatch = line.match(/^\[\[\s*(.*?)\s*\]\]$/);
      return wikiMatch ? `[[${wikiMatch[1].trim()}]]` : `[[${line}]]`;
    });

  return preserveEdgeNewlines(text, lines.join("\n"));
}

export function linesToMarkdownLinks(text: string): string {
  const lines = normalizeLineEndings(text)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      if (/^\[[^\]]+\]\([^)]+\)$/.test(line)) {
        return line;
      }

      const labelUrlMatch = line.match(/^(.+?)\s+-\s+(https?:\/\/\S+)$/i);

      if (labelUrlMatch) {
        return `[${labelUrlMatch[1].trim()}](${labelUrlMatch[2].trim()})`;
      }

      const urlMatch = line.match(/^(https?:\/\/\S+)$/i);

      if (urlMatch) {
        return `[${urlMatch[1]}](${urlMatch[1]})`;
      }

      return line;
    });

  return preserveEdgeNewlines(text, lines.join("\n"));
}

export function fixPdfLineBreaks(text: string): string {
  const lines = normalizeLineEndings(text).split("\n");
  const blocks: string[] = [];
  let currentBlock: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      flushPdfBlock(blocks, currentBlock);
      currentBlock = [];
      continue;
    }

    if (shouldKeepPdfLineSeparate(trimmed)) {
      flushPdfBlock(blocks, currentBlock);
      currentBlock = [];
      blocks.push(trimmed);
      continue;
    }

    currentBlock.push(trimmed);
  }

  flushPdfBlock(blocks, currentBlock);
  return preserveEdgeNewlines(text, blocks.join("\n\n"));
}

export function removeHyphenatedLineBreaks(text: string): string {
  return normalizeLineEndings(text).replace(/([A-Za-z])-\n([A-Za-z])/g, "$1$2");
}

export function stripListMarker(line: string): string {
  return line
    .trim()
    .replace(/^[-*+]\s+\[[ xX]\]\s+/, "")
    .replace(/^[-*+]\s+/, "")
    .replace(/^\d+[.)]\s+/, "");
}

export function getHeadingLevel(line: string): HeadingLevel | null {
  const match = line.match(/^ {0,3}(#{1,6})(?!#)\s*\S/);

  if (!match) {
    return null;
  }

  const level = match[1].length;
  return level === 1 || level === 2 || level === 3 || level === 4 || level === 5 || level === 6 ? level : null;
}

export function isFenceLine(line: string): boolean {
  return /^\s*(```|~~~)/.test(line);
}

function collectUniqueAndDuplicateLines(text: string): { uniqueLines: string[]; duplicateLines: string[] } {
  const seen = new Set<string>();
  const duplicateSeen = new Set<string>();
  const uniqueLines: string[] = [];
  const duplicateLines: string[] = [];

  for (const rawLine of normalizeLineEndings(text).split("\n")) {
    const line = rawLine.trim();

    if (line.length === 0) {
      continue;
    }

    if (seen.has(line)) {
      if (!duplicateSeen.has(line)) {
        duplicateLines.push(line);
        duplicateSeen.add(line);
      }
      continue;
    }

    seen.add(line);
    uniqueLines.push(line);
  }

  return { uniqueLines, duplicateLines };
}

function flushPdfBlock(blocks: string[], currentBlock: string[]): void {
  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join(" ").replace(/\s+/g, " "));
  }
}

function shouldKeepPdfLineSeparate(line: string): boolean {
  return getHeadingLevel(line) !== null
    || /^-{3,}$/.test(line)
    || /^[-*+]\s+/.test(line)
    || /^\d+[.)]\s+/.test(line)
    || /^\|.*\|$/.test(line)
    || /^\[\[.*\]\]$/.test(line);
}

function normalizeStartNumber(startAt: number): number {
  return Number.isFinite(startAt) && startAt > 0 ? Math.floor(startAt) : 1;
}

function isBlank(line: string): boolean {
  return line.trim().length === 0;
}

function hasNextNonBlankLine(lines: string[], startIndex: number): boolean {
  for (let index = startIndex; index < lines.length; index += 1) {
    if (!isBlank(lines[index])) {
      return true;
    }
  }

  return false;
}

function removeTrailingBlankLines(lines: string[]): void {
  while (lines.length > 0 && isBlank(lines[lines.length - 1])) {
    lines.pop();
  }
}

function trimExcessEdgeBlankLines(lines: string[]): string[] {
  const nextLines = [...lines];

  while (nextLines.length > 0 && isBlank(nextLines[0])) {
    nextLines.shift();
  }

  while (nextLines.length > 0 && isBlank(nextLines[nextLines.length - 1])) {
    nextLines.pop();
  }

  return nextLines;
}

function previousNonBlankLineIsDivider(lines: string[]): boolean {
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index].trim();

    if (line.length === 0) {
      continue;
    }

    return /^-{3,}$/.test(line);
  }

  return false;
}
