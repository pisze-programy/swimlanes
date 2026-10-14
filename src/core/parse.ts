/**
 * Parser: turn the statement list into the immutable diagram model.
 *
 * The parser resolves actor order, aliases and auto numbering. Note actor
 * ranges are resolved here when possible and left to layout otherwise.
 */

import { parseInline, parseInlineLines } from "./inline";
import { lex } from "./lex";
import type {
  Actor,
  Block,
  Diagram,
  InlineLine,
  SectionBlock,
  SectionBranch,
} from "./model";

interface MutableBranch {
  label: InlineLine;
  blocks: Block[];
}

interface Frame {
  type: "if" | "group";
  branches: MutableBranch[];
}

export function parseDiagram(source: string): Diagram {
  const statements = lex(source);
  const actorNames = new Map<string, string>();
  const root: Block[] = [];
  const stack: Frame[] = [];
  const ordering: string[] = [];

  let title: InlineLine = [];
  let lastFrom = "";
  let lastTo = "";
  let autoNumber = 0;
  let autoActive = false;

  const target = (): Block[] => {
    const frame = stack[stack.length - 1];
    if (frame === undefined) {
      return root;
    }
    const branch = frame.branches[frame.branches.length - 1];
    if (branch === undefined) {
      return root;
    }
    return branch.blocks;
  };

  const ensureActor = (key: string): void => {
    if (key.length === 0) {
      return;
    }
    if (!actorNames.has(key)) {
      actorNames.set(key, key);
    }
  };

  for (const statement of statements) {
    switch (statement.kind) {
      case "title":
        title = parseInline(statement.text);
        break;
      case "autonumber":
        autoActive = true;
        autoNumber = statement.start;
        break;
      case "order":
        ordering.length = 0;
        ordering.push(...statement.names);
        break;
      case "alias":
        actorNames.set(statement.name, statement.target);
        break;
      case "section":
        stack.push({
          type: statement.section,
          branches: [{ label: parseInline(statement.label), blocks: [] }],
        });
        break;
      case "else": {
        const frame = stack[stack.length - 1];
        if (frame !== undefined) {
          frame.branches.push({ label: parseInline(statement.label), blocks: [] });
        }
        break;
      }
      case "end": {
        const frame = stack.pop();
        if (frame !== undefined) {
          const branches: SectionBranch[] = frame.branches.map((branch) => ({
            label: branch.label,
            blocks: branch.blocks,
          }));
          const section: SectionBlock = { kind: "section", type: frame.type, branches };
          target().push(section);
        }
        break;
      }
      case "message": {
        ensureActor(statement.from);
        ensureActor(statement.to);
        let number = "";
        if (autoActive) {
          number = String(autoNumber);
          autoNumber += 1;
        }
        target().push({
          kind: "message",
          from: statement.from,
          to: statement.to,
          arrow: statement.arrow,
          label: parseInline(statement.text),
          number,
        });
        lastFrom = statement.from;
        lastTo = statement.to;
        break;
      }
      case "note": {
        let start = statement.start;
        let end = statement.end;
        if (start.length === 0) {
          start = lastFrom;
          end = lastTo;
        }
        if (end.length === 0) {
          end = start;
        }
        ensureActor(start);
        ensureActor(end);
        target().push({
          kind: "note",
          start,
          end,
          lines: parseInlineLines(statement.lines),
        });
        break;
      }
      case "divider":
        target().push({ kind: "divider", style: statement.style, label: parseInline(statement.text) });
        break;
      case "delay":
        target().push({ kind: "delay", label: parseInline(statement.text) });
        break;
    }
  }

  while (stack.length > 0) {
    const frame = stack.pop();
    if (frame === undefined) {
      break;
    }
    const branches: SectionBranch[] = frame.branches.map((branch) => ({
      label: branch.label,
      blocks: branch.blocks,
    }));
    target().push({ kind: "section", type: frame.type, branches });
  }

  const actors: Actor[] = [];
  const used = new Set<string>();
  for (const name of ordering) {
    const display = actorNames.get(name);
    if (display !== undefined && !used.has(name)) {
      used.add(name);
      actors.push({ key: name, label: parseInline(display) });
    }
  }
  for (const [key, display] of actorNames) {
    if (!used.has(key)) {
      used.add(key);
      actors.push({ key, label: parseInline(display) });
    }
  }

  return { title, actors, blocks: root };
}
