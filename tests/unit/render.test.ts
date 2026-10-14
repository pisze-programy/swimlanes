import { describe, expect, it } from "vitest";
import { diagramToSvg, layoutDiagram, parseDiagram, renderSvg } from "../../src/core";

const sample = [
  "title: Checkout",
  "Client -> Gateway: Pay",
  "Gateway -->> Bank: Authorise",
  "Gateway -> Gateway: Log",
  "note Client, Bank: A note",
  "if: Approved",
  "Bank -> Gateway: ok",
  "else: Declined",
  "Bank -> Gateway: no",
  "end",
  "_: Done",
  "...: waiting",
].join("\n");

describe("renderSvg", () => {
  it("renders a well-formed svg root", () => {
    const svg = diagramToSvg(parseDiagram(sample));
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.endsWith("</svg>")).toBe(true);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it("does not leak undefined into the markup", () => {
    const svg = diagramToSvg(parseDiagram(sample));
    expect(svg).not.toContain("undefined");
    expect(svg).not.toContain("NaN");
  });

  it("draws actors, arrows and lifelines", () => {
    const layout = layoutDiagram(parseDiagram(sample));
    const svg = renderSvg(layout);
    expect(layout.actors.map((actor) => actor.key)).toEqual(["Client", "Gateway", "Bank"]);
    expect(svg).toContain("<line");
    expect(svg).toContain("<path");
  });

  it("escapes markup in labels", () => {
    const diagram = parseDiagram("A -> B: <script> & \"quotes\"");
    const svg = diagramToSvg(diagram);
    expect(svg).toContain("&lt;script&gt;");
    expect(svg).not.toContain("<script>");
  });

  it("drops unsafe link schemes", () => {
    const svg = diagramToSvg(parseDiagram("A -> B: [x](javascript:alert(1))"));
    expect(svg).not.toContain("javascript:");
    expect(svg).toContain(">x<");
  });

  it("keeps safe links", () => {
    const svg = diagramToSvg(parseDiagram("A -> B: [x](https://example.com)"));
    expect(svg).toContain('href="https://example.com"');
    expect(svg).toContain("noreferrer");
  });

  it("draws actor boxes at the top and the bottom", () => {
    const svg = diagramToSvg(parseDiagram("A -> B: x"));
    expect(svg.match(/>A</g)?.length).toBe(2);
    expect(svg.match(/>B</g)?.length).toBe(2);
  });

  it("grows the height for each message", () => {
    const small = layoutDiagram(parseDiagram("A -> B: one"));
    const large = layoutDiagram(parseDiagram("A -> B: one\nA -> B: two\nA -> B: three"));
    expect(large.height).toBeGreaterThan(small.height);
  });

  it("lays out without any actors", () => {
    const layout = layoutDiagram(parseDiagram("title: Empty"));
    expect(layout.actors).toHaveLength(0);
    expect(layout.width).toBeGreaterThan(0);
    expect(layout.height).toBeGreaterThan(0);
  });
});
