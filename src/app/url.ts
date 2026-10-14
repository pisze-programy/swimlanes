/** Reading and writing the URL: fragment share links and path short links. */

import { decodeDiagram, encodeDiagram } from "../share/codec";

const shortIdPattern = /^\/d\/([0-9A-Za-z_-]{4,64})\/?$/;

export function readHashSource(): string | undefined {
  const hash = window.location.hash;
  if (hash.length <= 1) {
    return undefined;
  }
  return decodeDiagram(hash.slice(1));
}

export function readShortId(): string | undefined {
  const match = shortIdPattern.exec(window.location.pathname);
  if (match === null) {
    return undefined;
  }
  return match[1];
}

export function shareUrl(source: string): string {
  const url = new URL("/", window.location.origin);
  url.hash = encodeDiagram(source);
  return url.toString();
}

export function writeShareUrl(source: string): void {
  window.history.replaceState(null, "", shareUrl(source));
}

export function shortUrl(id: string): string {
  return new URL("/d/" + id, window.location.origin).toString();
}

export function writeShortUrl(id: string): void {
  window.history.pushState(null, "", "/d/" + id);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
