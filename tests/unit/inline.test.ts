import { describe, expect, it } from "vitest";
import { parseInline, safeHref } from "../../src/core/inline";

describe("parseInline", () => {
  it("keeps plain text", () => {
    expect(parseInline("hello")).toMatchObject([{ kind: "text", text: "hello", bold: false }]);
  });

  it("reads bold, italic, strike and code", () => {
    const runs = parseInline("**b** _i_ ~~s~~ `c`");
    expect(runs).toMatchObject([
      { kind: "text", text: "b", bold: true },
      { kind: "text", text: " " },
      { kind: "text", text: "i", italic: true },
      { kind: "text", text: " " },
      { kind: "text", text: "s", strike: true },
      { kind: "text", text: " " },
      { kind: "text", text: "c", code: true },
    ]);
  });

  it("reads italics with asterisks", () => {
    expect(parseInline("*i*")).toMatchObject([{ kind: "text", text: "i", italic: true }]);
  });

  it("reads links", () => {
    expect(parseInline("[docs](https://example.com)")).toMatchObject([
      { kind: "link", text: "docs", href: "https://example.com" },
    ]);
  });

  it("reads icons with a set and size", () => {
    expect(parseInline("{fas-user fa-2x}")).toMatchObject([
      { kind: "icon", set: "solid", name: "user", size: "double" },
    ]);
    expect(parseInline("{fab-font-awesome}")).toMatchObject([
      { kind: "icon", set: "brand", name: "font-awesome" },
    ]);
    expect(parseInline("{fa-sign-in-alt}")).toMatchObject([
      { kind: "icon", set: "solid", name: "sign-in-alt" },
    ]);
  });

  it("leaves unknown braces as text", () => {
    expect(parseInline("{not an icon}")).toMatchObject([{ kind: "text", text: "{not an icon}" }]);
  });

  it("supports escaped characters", () => {
    expect(parseInline("\\*literal\\*")).toMatchObject([{ kind: "text", text: "*literal*" }]);
  });

  it("reads links with parentheses in the target", () => {
    expect(parseInline("[x](https://example.com/a(b))")).toMatchObject([
      { kind: "link", text: "x", href: "https://example.com/a(b)" },
    ]);
  });
});

describe("safeHref", () => {
  it("allows same-origin paths and http, https and mailto", () => {
    expect(safeHref("/gallery/x")).toBe("/gallery/x");
    expect(safeHref("#top")).toBe("#top");
    expect(safeHref("https://example.com")).toBe("https://example.com");
    expect(safeHref("mailto:a@b.c")).toBe("mailto:a@b.c");
  });

  it("rejects everything else", () => {
    expect(safeHref("javascript:alert(1)")).toBeUndefined();
    expect(safeHref("data:text/html,x")).toBeUndefined();
    expect(safeHref("//evil.example")).toBeUndefined();
    expect(safeHref("relative/path")).toBeUndefined();
    expect(safeHref("")).toBeUndefined();
  });
});
