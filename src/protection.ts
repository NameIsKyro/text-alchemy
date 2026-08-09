import type { TextAlchemySettings } from "./types";
import { isFenceLine, normalizeLineEndings } from "./transforms";

export type TextTransform = (text: string) => string;

export function applyProtectedTransform(text: string, transform: TextTransform, settings: TextAlchemySettings): string {
  const normalized = normalizeLineEndings(text);
  const { frontmatter, body } = splitFrontmatter(normalized, settings.ignoreYamlFrontmatter);
  const transformedBody = transformOutsideCodeBlocks(body, transform, settings.ignoreCodeBlocks);
  return `${frontmatter}${transformedBody}`;
}

function splitFrontmatter(text: string, shouldIgnore: boolean): { frontmatter: string; body: string } {
  if (!shouldIgnore || !text.startsWith("---\n")) {
    return { frontmatter: "", body: text };
  }

  const lines = text.split("\n");

  for (let index = 1; index < lines.length; index += 1) {
    if (/^---\s*$/.test(lines[index])) {
      const frontmatter = `${lines.slice(0, index + 1).join("\n")}\n`;
      const body = lines.slice(index + 1).join("\n");
      return { frontmatter, body };
    }
  }

  return { frontmatter: text, body: "" };
}

function transformOutsideCodeBlocks(text: string, transform: TextTransform, shouldIgnore: boolean): string {
  if (!shouldIgnore) {
    return transform(text);
  }

  const lines = text.split("\n");
  const output: string[] = [];
  let outsideLines: string[] = [];
  let inFence = false;

  const flushOutside = (): void => {
    if (outsideLines.length > 0) {
      output.push(transform(outsideLines.join("\n")));
      outsideLines = [];
    }
  };

  for (const line of lines) {
    if (!inFence && isFenceLine(line)) {
      flushOutside();
      output.push(line);
      inFence = true;
      continue;
    }

    if (inFence) {
      output.push(line);
      if (isFenceLine(line)) {
        inFence = false;
      }
      continue;
    }

    outsideLines.push(line);
  }

  flushOutside();
  return output.join("\n");
}
