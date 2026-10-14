import { describe, expect, it } from "vitest";
import { base64UrlToBytes, bytesToBase64Url, decodeDiagram, encodeDiagram } from "../../src/share/codec";

describe("share codec", () => {
  it("round-trips a diagram source", () => {
    const source = "title: Test\nA -> B: hello\nB -->> A: world";
    const encoded = encodeDiagram(source);
    expect(decodeDiagram(encoded)).toBe(source);
  });

  it("produces url-safe characters", () => {
    const encoded = encodeDiagram("A -> B: ".repeat(50));
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("returns undefined for invalid input", () => {
    expect(decodeDiagram("not-valid-deflate-data")).toBeUndefined();
    expect(decodeDiagram("")).toBeUndefined();
  });

  it("rejects an oversized decoded diagram", () => {
    const encoded = encodeDiagram(" ".repeat(600_000));
    expect(decodeDiagram(encoded)).toBeUndefined();
  });

  it("round-trips bytes", () => {
    const bytes = Uint8Array.from([0, 1, 2, 250, 251, 252, 253, 254, 255]);
    expect(Array.from(base64UrlToBytes(bytesToBase64Url(bytes)))).toEqual(Array.from(bytes));
  });
});
