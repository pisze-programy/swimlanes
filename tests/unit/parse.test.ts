import { describe, expect, it } from "vitest";
import { parseDiagram } from "../../src/core/parse";

describe("parseDiagram", () => {
  it("collects actors in first-seen order", () => {
    const diagram = parseDiagram("A -> B: hi\nC -> A: yo");
    expect(diagram.actors.map((actor) => actor.key)).toEqual(["A", "B", "C"]);
  });

  it("reads the title", () => {
    const diagram = parseDiagram("title: Hello A -> B: hi");
    expect(diagram.title).toMatchObject([{ kind: "text", text: "Hello A -> B: hi" }]);
  });

  it("parses each arrow type", () => {
    const diagram = parseDiagram(
      ["A -> B: simple", "A ->> B: open", "A -x B: lost", "A <-> B: both", "A <-- B: dashed", "A => B: bold"].join("\n"),
    );
    const [simple, open, lost, both, dashed, bold] = diagram.blocks;
    expect(simple).toMatchObject({ kind: "message", arrow: { line: "solid", head: "standard", reverse: false } });
    expect(open).toMatchObject({ kind: "message", arrow: { line: "solid", head: "open" } });
    expect(lost).toMatchObject({ kind: "message", arrow: { line: "solid", head: "cross" } });
    expect(both).toMatchObject({ kind: "message", arrow: { head: "bidirectional" } });
    expect(dashed).toMatchObject({ kind: "message", arrow: { line: "dashed" } });
    expect(bold).toMatchObject({ kind: "message", arrow: { line: "bold" } });
  });

  it("reverses left-pointing messages", () => {
    const diagram = parseDiagram("One <- Two: reply");
    expect(diagram.blocks[0]).toMatchObject({ kind: "message", from: "Two", to: "One", arrow: { reverse: true } });
  });

  it("numbers messages when autonumber is on", () => {
    const diagram = parseDiagram("autonumber\nA -> B: one\nA -> B: two");
    expect(diagram.blocks[0]).toMatchObject({ kind: "message", number: "1" });
    expect(diagram.blocks[1]).toMatchObject({ kind: "message", number: "2" });
  });

  it("reads multi-line notes", () => {
    const diagram = parseDiagram("A -> B: hi\nnote:\nfirst line\nsecond line");
    const note = diagram.blocks[1];
    expect(note).toMatchObject({ kind: "note", start: "A", end: "B" });
    if (note !== undefined && note.kind === "note") {
      expect(note.lines).toHaveLength(2);
    }
  });

  it("sets note width from the previous message by default", () => {
    const diagram = parseDiagram("A -> B: hi\nnote: default");
    expect(diagram.blocks[1]).toMatchObject({ kind: "note", start: "A", end: "B" });
  });

  it("reads explicit note actors", () => {
    const diagram = parseDiagram("A -> B: hi\nC -> D: yo\nnote A, D: wide");
    expect(diagram.blocks[2]).toMatchObject({ kind: "note", start: "A", end: "D" });
  });

  it("nests sections one level", () => {
    const diagram = parseDiagram("if: outer\nA -> B: x\nif: inner\nA -> B: y\nend\nend");
    const section = diagram.blocks[0];
    expect(section).toMatchObject({ kind: "section", type: "if" });
    if (section !== undefined && section.kind === "section") {
      expect(section.branches).toHaveLength(1);
      expect(section.branches[0]?.blocks[1]).toMatchObject({ kind: "section" });
    }
  });

  it("adds else branches", () => {
    const diagram = parseDiagram("if: yes\nA -> B: x\nelse: no\nA -> B: y\nend");
    const section = diagram.blocks[0];
    if (section !== undefined && section.kind === "section") {
      expect(section.branches).toHaveLength(2);
    } else {
      throw new Error("expected a section");
    }
  });

  it("reads divider styles", () => {
    const diagram = parseDiagram("_: thin\n-: regular\n--: dashed\n=: bold");
    expect(diagram.blocks.map((block) => (block.kind === "divider" ? block.style : "no"))).toEqual([
      "thin",
      "regular",
      "dashed",
      "bold",
    ]);
  });

  it("reads delay", () => {
    const diagram = parseDiagram("A -> B: x\n...: waiting");
    expect(diagram.blocks[1]).toMatchObject({ kind: "delay" });
  });

  it("reorders actors with order", () => {
    const diagram = parseDiagram("A -> B: x\nB -> C: y\norder: C, B, A");
    expect(diagram.actors.map((actor) => actor.key)).toEqual(["C", "B", "A"]);
  });

  it("renames actors with alias", () => {
    const diagram = parseDiagram("alias A: Alpha\nA -> B: x");
    const alpha = diagram.actors[0];
    expect(alpha).toMatchObject({ key: "A" });
    if (alpha !== undefined) {
      expect(alpha.label).toMatchObject([{ kind: "text", text: "Alpha" }]);
    }
  });

  it("ignores comments", () => {
    const diagram = parseDiagram("// comment\nA -> B: x");
    expect(diagram.blocks).toHaveLength(1);
  });

  it("keeps content when a section is not closed", () => {
    const diagram = parseDiagram("if: open\nA -> B: y");
    expect(diagram.blocks).toHaveLength(1);
    expect(diagram.blocks[0]).toMatchObject({ kind: "section" });
  });

  it("accepts an actor named if", () => {
    const diagram = parseDiagram("if -> B: x");
    expect(diagram.blocks[0]).toMatchObject({ kind: "message", from: "if", to: "B" });
  });

  it("numbers from zero", () => {
    const diagram = parseDiagram("autonumber 0\nA -> B: x");
    expect(diagram.blocks[0]).toMatchObject({ kind: "message", number: "0" });
  });

  it("does not overflow on deep nesting", () => {
    let nested = "x";
    for (let index = 0; index < 5000; index += 1) {
      nested = "*" + nested + "*";
    }
    expect(() => parseDiagram("A -> B: " + nested)).not.toThrow();
  });
});
