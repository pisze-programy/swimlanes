/** Layout: turn the diagram model into absolutely positioned shapes. */

import { estimateMeasure, lineHasContent, lineWidth } from "./metrics";
import type { TextMeasure } from "./metrics";
import type { ArrowHead, ArrowLine, Block, Diagram, DividerStyle, InlineLine } from "./model";
import { emptyLine } from "./model";
import { fonts, metrics as consts } from "./theme";

export interface LaidOutActor {
  readonly key: string;
  readonly label: InlineLine;
  readonly left: number;
  readonly right: number;
  readonly center: number;
}

export interface ArrowShape {
  readonly kind: "arrow";
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly line: ArrowLine;
  readonly head: ArrowHead;
  readonly self: boolean;
  readonly label: InlineLine;
  readonly number: string;
  readonly labelX: number;
  readonly labelY: number;
  readonly labelAnchor: "middle" | "start";
}

export interface NoteShape {
  readonly kind: "note";
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly lines: readonly InlineLine[];
}

export interface DividerShape {
  readonly kind: "divider";
  readonly y: number;
  readonly x1: number;
  readonly x2: number;
  readonly style: DividerStyle;
  readonly label: InlineLine;
}

export interface DelayShape {
  readonly kind: "delay";
  readonly y: number;
  readonly x: number;
  readonly label: InlineLine;
}

export interface SectionBranchShape {
  readonly label: InlineLine;
  readonly labelY: number;
  readonly separatorY: number;
}

export interface SectionShape {
  readonly kind: "section";
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly type: "if" | "group";
  readonly branches: readonly SectionBranchShape[];
}

export type Shape = ArrowShape | NoteShape | DividerShape | DelayShape | SectionShape;

export interface Layout {
  readonly width: number;
  readonly height: number;
  readonly title: InlineLine;
  readonly titleY: number;
  readonly hasTitle: boolean;
  readonly actors: readonly LaidOutActor[];
  readonly actorTop: number;
  readonly actorBottom: number;
  readonly bottomTop: number;
  readonly lifelineTop: number;
  readonly lifelineBottom: number;
  readonly shapes: readonly Shape[];
}

const noteGap = 6;
const sectionGap = 8;

export function layoutDiagram(diagram: Diagram, measure: TextMeasure = estimateMeasure): Layout {
  const actors: LaidOutActor[] = [];
  const actorByKey = new Map<string, LaidOutActor>();
  const actorIndex = new Map<string, number>();

  let cursor = consts.padding;
  for (let index = 0; index < diagram.actors.length; index += 1) {
    const actor = diagram.actors[index];
    if (actor === undefined) {
      continue;
    }
    const labelWidth = lineWidth(actor.label, fonts.size, measure);
    const width = Math.max(labelWidth + consts.actorPaddingX * 2, consts.actorMinWidth);
    const left = cursor;
    const right = left + width;
    const placed: LaidOutActor = { key: actor.key, label: actor.label, left, right, center: left + width / 2 };
    actors.push(placed);
    actorByKey.set(actor.key, placed);
    actorIndex.set(actor.key, actors.length - 1);
    cursor = right + consts.actorGap;
  }

  const actorContentWidth =
    actors.length > 0 ? cursor - consts.actorGap + consts.padding : consts.padding * 2;

  const title = diagram.title;
  const hasTitle = lineHasContent(title);
  const titleY = consts.padding + fonts.titleSize;
  let y = consts.padding;
  if (hasTitle) {
    y += consts.titleLineHeight + consts.titleGap;
  }

  const actorTop = y;
  const actorBottom = actorTop + consts.actorHeight;

  const shapes: Shape[] = [];
  let maxX = actorContentWidth;

  const indexOf = (key: string): number => {
    const found = actorIndex.get(key);
    if (found === undefined) {
      return -1;
    }
    return found;
  };

  const spanOf = (blocks: readonly Block[]): { start: number; end: number } => {
    let start = -1;
    let end = -1;
    const include = (key: string): void => {
      const index = indexOf(key);
      if (index < 0) {
        return;
      }
      if (start < 0 || index < start) {
        start = index;
      }
      if (end < 0 || index > end) {
        end = index;
      }
    };
    const visit = (list: readonly Block[]): void => {
      for (const block of list) {
        if (block.kind === "message") {
          include(block.from);
          include(block.to);
        } else if (block.kind === "note") {
          include(block.start);
          include(block.end);
        } else if (block.kind === "section") {
          for (const branch of block.branches) {
            visit(branch.blocks);
          }
        }
      }
    };
    visit(blocks);
    if (start < 0 || end < 0) {
      return { start: 0, end: actors.length - 1 };
    }
    return { start, end };
  };

  const layoutBlocks = (blocks: readonly Block[], startY: number): number => {
    let blockY = startY;
    for (const block of blocks) {
      blockY = layoutBlock(block, blockY);
    }
    return blockY;
  };

  const layoutMessage = (block: Block & { kind: "message" }, blockY: number): number => {
    const from = actorByKey.get(block.from);
    const to = actorByKey.get(block.to);
    if (from === undefined || to === undefined) {
      return blockY;
    }
    if (block.from === block.to) {
      const topY = blockY + 12;
      const bottomY = topY + consts.selfLoopHeight;
      shapes.push({
        kind: "arrow",
        x1: from.center,
        y1: topY,
        x2: from.center + consts.selfLoopWidth,
        y2: bottomY,
        line: block.arrow.line,
        head: block.arrow.head,
        self: true,
        label: block.label,
        number: block.number,
        labelX: from.center + consts.selfLoopWidth + 8,
        labelY: topY + consts.selfLoopHeight / 2 + 5,
        labelAnchor: "start",
      });
      const right = from.center + consts.selfLoopWidth + 12 + lineWidth(block.label, fonts.size, measure);
      maxX = Math.max(maxX, right + consts.padding);
      return blockY + consts.selfHeight;
    }
    const labelY = blockY + consts.labelGap;
    const arrowY = blockY + consts.rowHeight - 10;
    shapes.push({
      kind: "arrow",
      x1: from.center,
      y1: arrowY,
      x2: to.center,
      y2: arrowY,
      line: block.arrow.line,
      head: block.arrow.head,
      self: false,
      label: block.label,
      number: block.number,
      labelX: (from.center + to.center) / 2,
      labelY,
      labelAnchor: "middle",
    });
    return blockY + consts.rowHeight;
  };

  const layoutNote = (block: Block & { kind: "note" }, blockY: number): number => {
    let startActor = actorByKey.get(block.start);
    let endActor = actorByKey.get(block.end);
    if (startActor === undefined) {
      startActor = actors[0];
    }
    if (endActor === undefined) {
      endActor = actors[actors.length - 1];
    }
    if (startActor === undefined || endActor === undefined) {
      return blockY;
    }
    const lines = block.lines.length > 0 ? block.lines : [emptyLine];
    let maxLineWidth = 0;
    for (const line of lines) {
      maxLineWidth = Math.max(maxLineWidth, lineWidth(line, fonts.size, measure));
    }
    const spanLeft = Math.min(startActor.left, endActor.left);
    const spanRight = Math.max(startActor.right, endActor.right);
    const contentWidth = maxLineWidth + consts.notePadding * 2;
    const width = Math.max(spanRight - spanLeft, contentWidth);
    const center = (spanLeft + spanRight) / 2;
    const left = Math.max(6, center - width / 2);
    const right = left + width;
    const height = lines.length * consts.noteLineHeight + consts.notePadding * 2;
    shapes.push({ kind: "note", x: left, y: blockY, w: width, h: height, lines });
    maxX = Math.max(maxX, right + consts.padding);
    return blockY + height + noteGap;
  };

  const layoutBlock = (block: Block, blockY: number): number => {
    switch (block.kind) {
      case "message":
        return layoutMessage(block, blockY);
      case "note":
        return layoutNote(block, blockY);
      case "divider": {
        const lineY = blockY + consts.dividerHeight / 2 + 4;
        shapes.push({
          kind: "divider",
          y: lineY,
          x1: consts.padding,
          x2: consts.padding,
          style: block.style,
          label: block.label,
        });
        return blockY + consts.dividerHeight;
      }
      case "delay": {
        const first = actors[0];
        const x = first === undefined ? consts.padding : first.center;
        shapes.push({ kind: "delay", y: blockY + consts.delayHeight / 2, x, label: block.label });
        return blockY + consts.delayHeight;
      }
      case "section":
        return layoutSection(block, blockY);
    }
  };

  const layoutSection = (block: Block & { kind: "section" }, blockY: number): number => {
    const span = spanOf([block]);
    const startActor = actors[span.start];
    const endActor = actors[span.end];
    const left = (startActor === undefined ? consts.padding : startActor.left) - consts.sectionPadding;
    const right = (endActor === undefined ? consts.padding : endActor.right) + consts.sectionPadding;
    const marker = shapes.length;
    const branches: SectionBranchShape[] = [];
    const labelHeight = consts.sectionLabelHeight;
    let innerY = blockY + labelHeight;
    for (let index = 0; index < block.branches.length; index += 1) {
      const branch = block.branches[index];
      if (branch === undefined) {
        continue;
      }
      let separatorY = 0;
      if (index > 0) {
        separatorY = innerY;
        innerY += labelHeight;
      }
      branches.push({ label: branch.label, labelY: innerY - labelHeight + labelHeight / 2 + 5, separatorY });
      innerY = layoutBlocks(branch.blocks, innerY);
      if (index < block.branches.length - 1) {
        innerY += consts.sectionBranchGap;
      }
    }
    const bottom = innerY + consts.sectionPadding;
    const children = shapes.splice(marker);
    shapes.push({
      kind: "section",
      x: left,
      y: blockY,
      w: right - left,
      h: bottom - blockY,
      type: block.type,
      branches,
    });
    for (const child of children) {
      shapes.push(child);
    }
    maxX = Math.max(maxX, right + consts.padding);
    return bottom + sectionGap;
  };

  const endY = layoutBlocks(diagram.blocks, actorBottom);
  const bottomTop = endY + consts.padding;
  const lifelineTop = actorBottom;
  const lifelineBottom = bottomTop;

  if (hasTitle) {
    maxX = Math.max(maxX, lineWidth(title, fonts.titleSize, measure) + consts.padding * 2);
  }

  const width = Math.ceil(Math.max(consts.minWidth, actorContentWidth, maxX));
  const finalShapes = shapes.map((shape) => {
    if (shape.kind === "divider") {
      return { ...shape, x2: width - consts.padding };
    }
    return shape;
  });

  return {
    width,
    height: Math.ceil(bottomTop + consts.actorHeight + consts.padding),
    title,
    titleY,
    hasTitle,
    actors,
    actorTop,
    actorBottom,
    bottomTop,
    lifelineTop,
    lifelineBottom,
    shapes: finalShapes,
  };
}
