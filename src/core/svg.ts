/** Tiny helpers to build SVG markup. */

export type AttrValue = string | number;

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function el(
  tag: string,
  attributes: readonly (readonly [string, AttrValue])[],
  body: string | undefined,
): string {
  let result = "<" + tag;
  for (const pair of attributes) {
    result += " " + pair[0] + '="' + escapeXml(String(pair[1])) + '"';
  }
  if (body === undefined) {
    return result + " />";
  }
  return result + ">" + body + "</" + tag + ">";
}
