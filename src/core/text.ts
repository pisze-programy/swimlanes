/** Small string helpers with explicit undefined handling. */

/** Read a capture group, returning "" when the group did not match. */
export function group(match: RegExpMatchArray, index: number): string {
  const value = match[index];
  if (value === undefined) {
    return "";
  }
  return value;
}

/** Read a list item, returning "" when the index is out of range. */
export function at(list: readonly string[], index: number): string {
  const value = list[index];
  if (value === undefined) {
    return "";
  }
  return value;
}

export function splitLines(source: string): string[] {
  return source.split(/\r\n|\r|\n/);
}

export function isComment(line: string): boolean {
  return line.trimStart().startsWith("//");
}
