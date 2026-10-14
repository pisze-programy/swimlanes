/** Canvas text measurement for accurate layout in the browser. */

import { estimateMeasure } from "../core/metrics";
import type { TextMeasure } from "../core/metrics";
import { fonts } from "../core/theme";

export function createCanvasMeasure(): TextMeasure {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (context === null) {
    return estimateMeasure;
  }
  const cache = new Map<string, number>();
  return {
    width(text: string, size: number, bold: boolean, code: boolean): number {
      const key = (bold ? "1" : "0") + (code ? "1" : "0") + size + "|" + text;
      const cached = cache.get(key);
      if (cached !== undefined) {
        return cached;
      }
      const weight = bold ? "600" : "400";
      const family = code ? fonts.codeFamily : fonts.family;
      context.font = weight + " " + size + "px " + family;
      const measured = context.measureText(text).width;
      cache.set(key, measured);
      return measured;
    },
  };
}
