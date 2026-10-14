/**
 * Share codec: compress the diagram source and encode it for a URL fragment.
 * Uses raw DEFLATE (as swimlanes.io does) with URL-safe base64.
 */

import { Inflate, deflateSync } from "fflate";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

const lookup = ((): Int8Array => {
  const table = new Int8Array(128);
  table.fill(-1);
  for (let index = 0; index < alphabet.length; index += 1) {
    table[alphabet.charCodeAt(index)] = index;
  }
  return table;
})();

export function bytesToBase64Url(bytes: Uint8Array): string {
  let result = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const b0 = bytes[index];
    if (b0 === undefined) {
      break;
    }
    const b1 = bytes[index + 1];
    const b2 = bytes[index + 2];
    result += alphabet.charAt(b0 >> 2);
    const low0 = (b0 & 3) << 4;
    if (b1 === undefined) {
      result += alphabet.charAt(low0);
      break;
    }
    result += alphabet.charAt(low0 | (b1 >> 4));
    const low1 = (b1 & 15) << 2;
    if (b2 === undefined) {
      result += alphabet.charAt(low1);
      break;
    }
    result += alphabet.charAt(low1 | (b2 >> 6));
    result += alphabet.charAt(b2 & 63);
  }
  return result;
}

export function base64UrlToBytes(text: string): Uint8Array {
  const out: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code < 0 || code >= lookup.length) {
      continue;
    }
    const value = lookup[code];
    if (value === undefined || value < 0) {
      continue;
    }
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((buffer >> bits) & 0xff);
    }
  }
  return Uint8Array.from(out);
}

export function encodeDiagram(source: string): string {
  const bytes = new TextEncoder().encode(source);
  const compressed = deflateSync(bytes, { level: 9 });
  return bytesToBase64Url(compressed);
}

const maxEncodedLength = 512 * 1024;
const maxDecodedBytes = 512 * 1024;

export function decodeDiagram(encoded: string): string | undefined {
  const trimmed = encoded.trim();
  if (trimmed.length === 0 || trimmed.length > maxEncodedLength) {
    return undefined;
  }
  const bytes = base64UrlToBytes(trimmed);
  if (bytes.length === 0) {
    return undefined;
  }
  try {
    const chunks: Uint8Array[] = [];
    let total = 0;
    let overflow = false;
    const inflate = new Inflate((chunk) => {
      total += chunk.length;
      if (total > maxDecodedBytes) {
        overflow = true;
        throw new Error("decoded diagram is too large");
      }
      chunks.push(chunk);
    });
    inflate.push(bytes, true);
    if (overflow) {
      return undefined;
    }
    const output = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      output.set(chunk, offset);
      offset += chunk.length;
    }
    return new TextDecoder().decode(output);
  } catch {
    return undefined;
  }
}
