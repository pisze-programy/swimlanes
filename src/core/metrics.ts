/** Text measurement. The default is an estimate that runs in any environment. */

import type { InlineLine, InlineRun } from "./model";

export interface TextMeasure {
  width(text: string, size: number, bold: boolean, code: boolean): number;
}

const narrowChars = "ijltf.,;:!|'`\"()[]{}-";
const wideChars = "MWmw@%&";

function charFactor(char: string): number {
  if (narrowChars.includes(char)) {
    return 0.3;
  }
  if (wideChars.includes(char)) {
    return 0.92;
  }
  if (char === " ") {
    return 0.28;
  }
  if (char >= "A" && char <= "Z") {
    return 0.63;
  }
  if (char >= "0" && char <= "9") {
    return 0.57;
  }
  return 0.52;
}

function estimateWidth(text: string, size: number, bold: boolean, code: boolean): number {
  if (code) {
    return text.length * size * 0.6;
  }
  let total = 0;
  for (const char of text) {
    total += charFactor(char);
  }
  const weight = bold ? 1.06 : 1;
  return total * size * weight;
}

export const estimateMeasure: TextMeasure = { width: estimateWidth };

function iconWidth(size: number, sizeName: string): number {
  if (sizeName === "double") {
    return size * 2;
  }
  if (sizeName === "large") {
    return size * 1.4;
  }
  return size * 1.1;
}

export function runWidth(run: InlineRun, size: number, measure: TextMeasure): number {
  if (run.kind === "icon") {
    return iconWidth(size, run.size);
  }
  if (run.kind === "link") {
    return measure.width(run.text, size, run.bold, false);
  }
  return measure.width(run.text, size, run.bold, run.code);
}

export function lineWidth(line: InlineLine, size: number, measure: TextMeasure): number {
  let total = 0;
  for (const run of line) {
    total += runWidth(run, size, measure);
  }
  return total;
}

export function lineHasContent(line: InlineLine): boolean {
  for (const run of line) {
    if (run.kind === "icon") {
      return true;
    }
    if (run.text.length > 0) {
      return true;
    }
  }
  return false;
}
