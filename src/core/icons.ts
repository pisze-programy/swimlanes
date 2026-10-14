/** Resolve Font Awesome icon names to a glyph and font. */

import { iconGlyphs } from "./icons.generated";
import type { FaSet } from "./model";

export interface IconGlyph {
  readonly unicode: string;
  readonly solid: boolean;
  readonly regular: boolean;
  readonly brand: boolean;
}

export interface ResolvedIcon {
  readonly unicode: string;
  readonly family: string;
  readonly weight: number;
}

export const classicFamily = "Font Awesome 7 Free";
export const brandFamily = "Font Awesome 7 Brands";
export const solidWeight = 900;
export const regularWeight = 400;

function classic(glyph: IconGlyph, weight: number): ResolvedIcon {
  return { unicode: glyph.unicode, family: classicFamily, weight };
}

export function resolveIcon(set: FaSet, name: string): ResolvedIcon | undefined {
  const glyph = iconGlyphs.get(name);
  if (glyph === undefined) {
    return undefined;
  }
  if (set === "brand") {
    if (glyph.brand) {
      return { unicode: glyph.unicode, family: brandFamily, weight: regularWeight };
    }
    return undefined;
  }
  if (set === "regular" && glyph.regular) {
    return classic(glyph, regularWeight);
  }
  if (glyph.solid) {
    return classic(glyph, solidWeight);
  }
  if (glyph.regular) {
    return classic(glyph, regularWeight);
  }
  if (glyph.brand) {
    return { unicode: glyph.unicode, family: brandFamily, weight: regularWeight };
  }
  return undefined;
}
