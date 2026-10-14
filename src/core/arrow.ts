/** Parse arrow tokens such as `->`, `->>`, `-x`, `<->`, `<--`, `=>`, `-->>`. */

import type { Arrow, ArrowHead, ArrowLine } from "./model";

const arrowTokenPattern = /^(<)?(-{1,2}|=)(>{1,2}|x)?$/;

function lineFromToken(token: string): ArrowLine {
  if (token === "=") {
    return "bold";
  }
  if (token === "--") {
    return "dashed";
  }
  return "solid";
}

function headFromParts(left: string, right: string): ArrowHead {
  if (left === "<" && right === ">") {
    return "bidirectional";
  }
  if (right === "x") {
    return "cross";
  }
  if (right === ">>") {
    return "open";
  }
  return "standard";
}

export function parseArrowToken(token: string): Arrow | undefined {
  const match = arrowTokenPattern.exec(token);
  if (match === null) {
    return undefined;
  }
  const left = match[1];
  const line = match[2];
  const right = match[3];
  const leftHead = left === undefined ? "" : left;
  const rightHead = right === undefined ? "" : right;
  if (line === undefined) {
    return undefined;
  }
  if (leftHead.length === 0 && rightHead.length === 0) {
    return undefined;
  }
  const head = headFromParts(leftHead, rightHead);
  const reverse = leftHead.length > 0 && head !== "bidirectional";
  return {
    line: lineFromToken(line),
    head,
    reverse,
  };
}
