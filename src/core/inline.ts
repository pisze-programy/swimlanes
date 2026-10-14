/**
 * Parse the inline markup used by messages, notes, dividers and labels:
 * `**bold**`, `*italic*`, `_italic_`, `~~strike~~`, `` `code` ``,
 * `[text](href)` and Font Awesome icons `{fas-user fa-lg}`.
 */

import type { FaSet, FaSize, IconRun, InlineLine, InlineRun, LinkRun, TextRun } from "./model";

interface Style {
  readonly bold: boolean;
  readonly italic: boolean;
  readonly strike: boolean;
}

const plain: Style = { bold: false, italic: false, strike: false };

/** Allow one level of nested parentheses in a link target. */
const linkPattern = /^\[([^\]]*)\]\(([^()]*(?:\([^()]*\)[^()]*)*)\)/;
const iconPattern = /^\{([^}]*)\}/;
const iconNamePattern = /^fa([slrdb])?-(.+)$/;
const schemePattern = /^([a-zA-Z][a-zA-Z0-9+.-]*):/;

const emphasisBoundary = /[\s.,;:!?()[\]{}"'`>/\-]/;

/** Max inline nesting. Past this, text is kept literal. */
const maxDepth = 16;

/**
 * Return a link target only when it is safe to put in an anchor.
 * Same-origin paths and http, https, mailto are allowed. Everything else,
 * including `javascript:` and `data:`, returns undefined.
 */
export function safeHref(raw: string): string | undefined {
  const value = raw.trim();
  if (value.length === 0) {
    return undefined;
  }
  if (value.startsWith("//")) {
    return undefined;
  }
  if (value.startsWith("/") || value.startsWith("#") || value.startsWith("?")) {
    return value;
  }
  const match = schemePattern.exec(value);
  if (match === null) {
    return undefined;
  }
  const scheme = (match[1] === undefined ? "" : match[1]).toLowerCase();
  if (scheme === "http" || scheme === "https" || scheme === "mailto") {
    return value;
  }
  return undefined;
}

function isBoundary(text: string, index: number): boolean {
  if (index <= 0) {
    return true;
  }
  if (index >= text.length) {
    return true;
  }
  return emphasisBoundary.test(text.charAt(index));
}

/** Find a lone delimiter, skipping longer runs such as `**` or `~~`. */
function findEmphasisClose(text: string, from: number, char: string): number {
  let index = from;
  while (index < text.length) {
    const current = text.charAt(index);
    if (current === "\\") {
      index += 2;
      continue;
    }
    if (current === char) {
      const next = text.charAt(index + 1);
      if (next === char) {
        index += 2;
        continue;
      }
      if (char === "_" && !isBoundary(text, index + 1)) {
        index += 1;
        continue;
      }
      return index;
    }
    index += 1;
  }
  return -1;
}

function textRun(text: string, style: Style, code: boolean): TextRun {
  return {
    kind: "text",
    text,
    bold: style.bold,
    italic: style.italic,
    strike: style.strike,
    code,
  };
}

function parseIcon(body: string): IconRun | undefined {
  const parts = body.trim().split(/\s+/);
  const head = parts[0];
  if (head === undefined) {
    return undefined;
  }
  const match = iconNamePattern.exec(head);
  if (match === null) {
    return undefined;
  }
  const setLetter = match[1];
  const name = match[2];
  if (name === undefined || name.length === 0) {
    return undefined;
  }
  return {
    kind: "icon",
    set: setFromLetter(setLetter),
    name,
    size: sizeFromParts(parts),
  };
}

function setFromLetter(letter: string | undefined): FaSet {
  if (letter === "r") {
    return "regular";
  }
  if (letter === "l") {
    return "light";
  }
  if (letter === "d") {
    return "duotone";
  }
  if (letter === "b") {
    return "brand";
  }
  return "solid";
}

function sizeFromParts(parts: readonly string[]): FaSize {
  for (const part of parts) {
    if (part === "fa-2x" || part === "fa-3x" || part === "fa-4x" || part === "fa-5x") {
      return "double";
    }
    if (part === "fa-lg" || part === "fa-xl" || part === "fa-sm") {
      return "large";
    }
  }
  return "normal";
}

function parseLink(text: string, style: Style): LinkRun {
  const match = linkPattern.exec(text);
  const href = match === null ? "" : match[2];
  const label = match === null ? text : match[1];
  return {
    kind: "link",
    text: label === undefined ? "" : label,
    href: href === undefined ? "" : href,
    bold: style.bold,
    italic: style.italic,
  };
}

export function parseInline(text: string): InlineRun[] {
  return parseRuns(text, plain, 0);
}

function parseRuns(text: string, style: Style, depth: number): InlineRun[] {
  if (depth > maxDepth) {
    return [textRun(text, style, false)];
  }
  const runs: InlineRun[] = [];
  let buffer = "";
  let index = 0;

  const flush = (): void => {
    if (buffer.length > 0) {
      runs.push(textRun(buffer, style, false));
      buffer = "";
    }
  };

  while (index < text.length) {
    const char = text.charAt(index);

    if (char === "\\" && index + 1 < text.length) {
      buffer += text.charAt(index + 1);
      index += 2;
      continue;
    }

    if (char === "`") {
      const close = text.indexOf("`", index + 1);
      if (close > index + 1) {
        flush();
        runs.push(textRun(text.slice(index + 1, close), style, true));
        index = close + 1;
        continue;
      }
    }

    if (text.startsWith("**", index)) {
      const end = text.indexOf("**", index + 2);
      if (end !== -1 && end > index + 2) {
        flush();
        runs.push(...parseRuns(text.slice(index + 2, end), { ...style, bold: true }, depth + 1));
        index = end + 2;
        continue;
      }
    }

    if (text.startsWith("~~", index)) {
      const close = text.indexOf("~~", index + 2);
      if (close !== -1) {
        flush();
        runs.push(...parseRuns(text.slice(index + 2, close), { ...style, strike: true }, depth + 1));
        index = close + 2;
        continue;
      }
    }

    if (char === "*" || char === "_") {
      const boundaryOk = char === "*" || isBoundary(text, index - 1);
      const close = boundaryOk ? findEmphasisClose(text, index + 1, char) : -1;
      if (close !== -1) {
        flush();
        runs.push(...parseRuns(text.slice(index + 1, close), { ...style, italic: true }, depth + 1));
        index = close + 1;
        continue;
      }
    }

    if (char === "[") {
      const match = linkPattern.exec(text.slice(index));
      if (match !== null) {
        flush();
        runs.push(parseLink(text.slice(index, index + match[0].length), style));
        index += match[0].length;
        continue;
      }
    }

    if (char === "{") {
      const match = iconPattern.exec(text.slice(index));
      if (match !== null) {
        const icon = parseIcon(match[1] === undefined ? "" : match[1]);
        if (icon !== undefined) {
          flush();
          runs.push(icon);
          index += match[0].length;
          continue;
        }
      }
    }

    buffer += char;
    index += 1;
  }

  flush();
  return runs;
}

/** Parse several lines of markup. */
export function parseInlineLines(lines: readonly string[]): InlineLine[] {
  return lines.map((line) => parseInline(line));
}
