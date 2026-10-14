/**
 * Lexer: turn raw diagram source into a flat list of statements.
 *
 * Multi-line notes are folded here. Everything else is one line per statement.
 */

import { parseArrowToken } from "./arrow";
import type { Arrow, DividerStyle } from "./model";
import { group, isComment, splitLines, at } from "./text";

export type Statement =
  | { readonly kind: "title"; readonly text: string }
  | {
      readonly kind: "message";
      readonly from: string;
      readonly to: string;
      readonly arrow: Arrow;
      readonly text: string;
    }
  | {
      readonly kind: "note";
      readonly start: string;
      readonly end: string;
      readonly lines: readonly string[];
    }
  | { readonly kind: "divider"; readonly style: DividerStyle; readonly text: string }
  | { readonly kind: "delay"; readonly text: string }
  | { readonly kind: "section"; readonly section: "if" | "group"; readonly label: string }
  | { readonly kind: "else"; readonly label: string }
  | { readonly kind: "end" }
  | { readonly kind: "order"; readonly names: readonly string[] }
  | { readonly kind: "alias"; readonly name: string; readonly target: string }
  | { readonly kind: "autonumber"; readonly start: number };

const titlePattern = /^title\s*:\s?(.*)$/;
const autonumberPattern = /^autonumber(?:\s+(\d+))?\s*$/;
const orderPattern = /^order\s*:\s?(.*)$/;
const aliasPattern = /^alias\s+(.+?)\s*:\s?(.*)$/;
const elsePattern = /^else\b(.*)$/;
const sectionPattern = /^(if|group)\b(.*)$/;
const endPattern = /^end\s*$/;
const dividerPattern = /^(_|-{1,2}|=)\s*:\s?(.*)$/;
const delayPattern = /^\.\.\.\s*:?\s?(.*)$/;
const notePattern = /^note(?:\s+([^:]*?))?\s*:\s?(.*)$/;

/** True when the text before the first colon contains a message arrow. */
function hasArrowBeforeColon(line: string): boolean {
  const colon = line.indexOf(":");
  const before = colon < 0 ? line : line.slice(0, colon);
  for (const token of before.split(/\s+/)) {
    if (parseArrowToken(token) !== undefined) {
      return true;
    }
  }
  return false;
}

function dividerStyle(token: string): DividerStyle {  if (token === "_") {
    return "thin";
  }
  if (token === "--") {
    return "dashed";
  }
  if (token === "=") {
    return "bold";
  }
  return "regular";
}

/** Strip one leading colon and surrounding whitespace from a label. */
function cleanLabel(rest: string): string {
  const trimmed = rest.trim();
  if (trimmed.startsWith(":")) {
    return trimmed.slice(1).trim();
  }
  return trimmed;
}

function parseMessageLine(line: string): Statement | undefined {
  const colon = line.indexOf(":");
  if (colon < 0) {
    return undefined;
  }
  const prefix = line.slice(0, colon).trim();
  const text = line.slice(colon + 1).trim();
  const tokens = prefix.split(/\s+/);
  if (tokens.length < 3) {
    return undefined;
  }
  let arrowIndex = -1;
  let arrow: Arrow | undefined;
  for (let index = 1; index < tokens.length - 1; index += 1) {
    const token = tokens[index];
    if (token === undefined) {
      continue;
    }
    const candidate = parseArrowToken(token);
    if (candidate !== undefined) {
      arrowIndex = index;
      arrow = candidate;
      break;
    }
  }
  if (arrowIndex < 0 || arrow === undefined) {
    return undefined;
  }
  const left = tokens.slice(0, arrowIndex).join(" ").trim();
  const right = tokens.slice(arrowIndex + 1).join(" ").trim();
  if (left.length === 0 || right.length === 0) {
    return undefined;
  }
  return {
    kind: "message",
    from: arrow.reverse ? right : left,
    to: arrow.reverse ? left : right,
    arrow,
    text,
  };
}

function parseNoteLine(line: string): Statement | undefined {
  const match = notePattern.exec(line);
  if (match === null) {
    return undefined;
  }
  const actors = group(match, 1).trim();
  const text = group(match, 2);
  let start = "";
  let end = "";
  if (actors.length > 0) {
    const parts = actors.split(",");
    start = at(parts, 0).trim();
    end = parts.length > 1 ? at(parts, 1).trim() : start;
  }
  const lines = text.length > 0 ? [text] : [];
  return { kind: "note", start, end, lines };
}

export function classifyLine(line: string): Statement | undefined {
  const title = titlePattern.exec(line);
  if (title !== null) {
    return { kind: "title", text: group(title, 1) };
  }
  const autonumber = autonumberPattern.exec(line);
  if (autonumber !== null) {
    const start = group(autonumber, 1);
    return { kind: "autonumber", start: start.length > 0 ? Number.parseInt(start, 10) : 1 };
  }
  const order = orderPattern.exec(line);
  if (order !== null) {
    const names = group(order, 1)
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);
    return { kind: "order", names };
  }
  const alias = aliasPattern.exec(line);
  if (alias !== null && !hasArrowBeforeColon(line)) {
    return { kind: "alias", name: group(alias, 1).trim(), target: group(alias, 2).trim() };
  }
  if (endPattern.test(line)) {
    return { kind: "end" };
  }
  const section = sectionPattern.exec(line);
  if (section !== null && !hasArrowBeforeColon(line)) {
    const keyword = group(section, 1);
    const type = keyword === "group" ? "group" : "if";
    return { kind: "section", section: type, label: cleanLabel(group(section, 2)) };
  }
  const alternative = elsePattern.exec(line);
  if (alternative !== null && !hasArrowBeforeColon(line)) {
    return { kind: "else", label: cleanLabel(group(alternative, 1)) };
  }
  const divider = dividerPattern.exec(line);
  if (divider !== null) {
    return { kind: "divider", style: dividerStyle(group(divider, 1)), text: group(divider, 2) };
  }
  const delay = delayPattern.exec(line);
  if (delay !== null) {
    return { kind: "delay", text: group(delay, 1) };
  }
  const note = parseNoteLine(line);
  if (note !== undefined && !hasArrowBeforeColon(line)) {
    return note;
  }
  return parseMessageLine(line);
}

function isStatementLine(line: string): boolean {
  return classifyLine(line.trim()) !== undefined;
}

function trimTrailingBlank(lines: string[]): void {
  while (lines.length > 0) {
    const last = lines[lines.length - 1];
    if (last === undefined || last.trim().length > 0) {
      break;
    }
    lines.pop();
  }
}

export function lex(source: string): Statement[] {
  const lines = splitLines(source);
  const out: Statement[] = [];
  let index = 0;

  while (index < lines.length) {
    const raw = lines[index];
    index += 1;
    if (raw === undefined) {
      continue;
    }
    const line = raw.trim();
    if (line.length === 0 || isComment(line)) {
      continue;
    }
    const statement = classifyLine(line);
    if (statement === undefined) {
      continue;
    }
    if (statement.kind === "note") {
      const body = statement.lines.slice();
      while (index < lines.length) {
        const next = lines[index];
        if (next === undefined) {
          break;
        }
        if (isComment(next)) {
          index += 1;
          continue;
        }
        if (isStatementLine(next)) {
          break;
        }
        body.push(next);
        index += 1;
      }
      trimTrailingBlank(body);
      out.push({ kind: "note", start: statement.start, end: statement.end, lines: body });
      continue;
    }
    out.push(statement);
  }

  return out;
}
