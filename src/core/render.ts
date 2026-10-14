/** Render: turn positioned shapes into SVG markup. */

import { resolveIcon } from "./icons";
import { safeHref } from "./inline";
import { layoutDiagram } from "./layout";
import type {
  ArrowShape,
  DelayShape,
  DividerShape,
  Layout,
  NoteShape,
  SectionShape,
  Shape,
} from "./layout";
import { estimateMeasure, lineWidth, runWidth } from "./metrics";
import type { TextMeasure } from "./metrics";
import type { ArrowHead, ArrowLine, Diagram, InlineLine, InlineRun } from "./model";
import { colors, fonts, metrics as consts } from "./theme";
import { el } from "./svg";
import type { AttrValue } from "./svg";
import { escapeXml } from "./svg";

type Anchor = "middle" | "start" | "end";
type Attr = readonly [string, AttrValue];

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function glyphText(unicode: string): string {
  const code = Number.parseInt(unicode, 16);
  return String.fromCodePoint(code);
}

function textElement(x: number, y: number, anchor: Anchor, attributes: readonly Attr[], content: string): string {
  const base: Attr[] = [
    ["x", round(x)],
    ["y", round(y)],
    ["text-anchor", anchor],
  ];
  return el("text", [...base, ...attributes], escapeXml(content));
}

function renderLine(
  line: InlineLine,
  x: number,
  y: number,
  anchor: Anchor,
  size: number,
  fill: string,
  measure: TextMeasure,
  forcedWeight: number,
): string {
  const total = lineWidth(line, size, measure);
  let cursor = x;
  if (anchor === "middle") {
    cursor = x - total / 2;
  } else if (anchor === "end") {
    cursor = x - total;
  }

  const parts: string[] = [];
  for (const run of line) {
    const width = runWidth(run, size, measure);
    if (run.kind === "icon") {
      const glyph = resolveIcon(run.set, run.name);
      if (glyph === undefined) {
        parts.push(
          el(
            "rect",
            [
              ["x", round(cursor)],
              ["y", round(y - size)],
              ["width", round(width)],
              ["height", round(size)],
              ["rx", 2],
              ["fill", "#eef1f5"],
              ["stroke", "#c3cad3"],
              ["stroke-width", 1],
            ],
            undefined,
          ),
        );
      } else {
        parts.push(
          textElement(cursor, y, "start", [
            ["font-family", glyph.family],
            ["font-weight", glyph.weight],
            ["font-size", round(size)],
            ["fill", fill],
          ], glyphText(glyph.unicode)),
        );
      }
      cursor += width;
      continue;
    }

    const attributes: Attr[] = [];
    const isCode = run.kind === "text" && run.code;
    attributes.push(["font-family", isCode ? fonts.codeFamily : fonts.family]);
    attributes.push(["font-size", round(size)]);
    const weight = forcedWeight > 0 ? forcedWeight : (run.bold ? 600 : 400);
    attributes.push(["font-weight", weight]);
    if (run.italic) {
      attributes.push(["font-style", "italic"]);
    }
    if (run.kind === "text" && run.strike) {
      attributes.push(["text-decoration", "line-through"]);
    }
    if (run.kind === "link") {
      attributes.push(["fill", colors.link]);
      attributes.push(["text-decoration", "underline"]);
    } else {
      attributes.push(["fill", fill]);
    }

    if (isCode) {
      parts.push(
        el(
          "rect",
          [
            ["x", round(cursor - 2)],
            ["y", round(y - size + 2)],
            ["width", round(width + 4)],
            ["height", round(size + 3)],
            ["rx", 3],
            ["fill", colors.codeFill],
          ],
          undefined,
        ),
      );
    }

    let element = textElement(cursor, y, "start", attributes, run.text);
    if (run.kind === "link") {
      const href = safeHref(run.href);
      if (href !== undefined) {
        element = el("a", [["href", href], ["target", "_blank"], ["rel", "noopener noreferrer"]], element);
      }
    }
    parts.push(element);
    cursor += width;
  }
  return parts.join("");
}

function dashFor(line: ArrowLine): Attr[] {
  if (line === "dashed") {
    return [["stroke-dasharray", "6 4"]];
  }
  return [];
}

function strokeWidthFor(line: ArrowLine): number {
  if (line === "bold") {
    return 2.6;
  }
  return 1.4;
}

function arrowHead(head: ArrowHead, tipX: number, tipY: number, dir: number, stroke: string): string {
  const size = 9;
  if (head === "cross") {
    const d = size * 0.42;
    return el(
      "path",
      [
        ["d", `M ${round(tipX - d)} ${round(tipY - d)} L ${round(tipX + d)} ${round(tipY + d)} M ${round(tipX - d)} ${round(tipY + d)} L ${round(tipX + d)} ${round(tipY - d)}`],
        ["stroke", stroke],
        ["stroke-width", 1.4],
        ["fill", "none"],
        ["stroke-linecap", "round"],
      ],
      undefined,
    );
  }
  if (head === "open") {
    const back = tipX - dir * size;
    return el(
      "path",
      [
        ["d", `M ${round(back)} ${round(tipY - size * 0.5)} L ${round(tipX)} ${round(tipY)} L ${round(back)} ${round(tipY + size * 0.5)}`],
        ["stroke", stroke],
        ["stroke-width", 1.4],
        ["fill", "none"],
        ["stroke-linecap", "round"],
        ["stroke-linejoin", "round"],
      ],
      undefined,
    );
  }
  const back = tipX - dir * size;
  return el(
    "path",
    [
      ["d", `M ${round(tipX)} ${round(tipY)} L ${round(back)} ${round(tipY - size * 0.5)} L ${round(back)} ${round(tipY + size * 0.5)} Z`],
      ["fill", stroke],
      ["stroke", "none"],
    ],
    undefined,
  );
}

function withNumber(label: InlineLine, number: string): InlineLine {
  if (number.length === 0) {
    return label;
  }
  const prefix: InlineRun = {
    kind: "text",
    text: number + " ",
    bold: false,
    italic: false,
    strike: false,
    code: false,
  };
  return [prefix, ...label];
}

function renderArrow(shape: ArrowShape, measure: TextMeasure): string {
  const stroke = colors.messageLine;
  const width = strokeWidthFor(shape.line);
  const parts: string[] = [];
  if (shape.self) {
    parts.push(
      el(
        "path",
        [
          ["d", `M ${round(shape.x1)} ${round(shape.y1)} L ${round(shape.x2)} ${round(shape.y1)} L ${round(shape.x2)} ${round(shape.y2)} L ${round(shape.x1)} ${round(shape.y2)}`],
          ["fill", "none"],
          ["stroke", stroke],
          ["stroke-width", width],
          ...dashFor(shape.line),
        ],
        undefined,
      ),
    );
    if (shape.head === "bidirectional") {
      parts.push(arrowHead("standard", shape.x1, shape.y2, -1, stroke));
      parts.push(arrowHead("standard", shape.x1, shape.y1, -1, stroke));
    } else {
      parts.push(arrowHead(shape.head, shape.x1, shape.y2, -1, stroke));
    }
  } else {
    parts.push(
      el(
        "line",
        [
          ["x1", round(shape.x1)],
          ["y1", round(shape.y1)],
          ["x2", round(shape.x2)],
          ["y2", round(shape.y2)],
          ["stroke", stroke],
          ["stroke-width", width],
          ...dashFor(shape.line),
        ],
        undefined,
      ),
    );
    const dir = shape.x2 >= shape.x1 ? 1 : -1;
    if (shape.head === "bidirectional") {
      parts.push(arrowHead("standard", shape.x2, shape.y2, dir, stroke));
      parts.push(arrowHead("standard", shape.x1, shape.y1, -dir, stroke));
    } else {
      parts.push(arrowHead(shape.head, shape.x2, shape.y2, dir, stroke));
    }
  }
  parts.push(
    renderLine(withNumber(shape.label, shape.number), shape.labelX, shape.labelY, shape.labelAnchor, fonts.size, colors.messageText, measure, 0),
  );
  return parts.join("");
}

function renderNote(shape: NoteShape, measure: TextMeasure): string {
  const parts: string[] = [];
  parts.push(
    el(
      "rect",
      [
        ["x", round(shape.x)],
        ["y", round(shape.y)],
        ["width", round(shape.w)],
        ["height", round(shape.h)],
        ["rx", 4],
        ["fill", colors.noteFill],
        ["stroke", colors.noteStroke],
        ["stroke-width", 1],
      ],
      undefined,
    ),
  );
  for (let index = 0; index < shape.lines.length; index += 1) {
    const line = shape.lines[index];
    if (line === undefined) {
      continue;
    }
    const baseline = shape.y + consts.notePadding + index * consts.noteLineHeight + consts.noteLineHeight * 0.68;
    parts.push(renderLine(line, shape.x + consts.notePadding, baseline, "start", fonts.size, colors.noteText, measure, 0));
  }
  return parts.join("");
}

function renderDivider(shape: DividerShape, measure: TextMeasure): string {
  const parts: string[] = [];
  let width = 1.1;
  const dash: Attr[] = [];
  if (shape.style === "thin") {
    width = 0.8;
  } else if (shape.style === "dashed") {
    dash.push(["stroke-dasharray", "5 4"]);
  } else if (shape.style === "bold") {
    width = 2.6;
  }
  parts.push(
    el(
      "line",
      [
        ["x1", round(shape.x1)],
        ["y1", round(shape.y)],
        ["x2", round(shape.x2)],
        ["y2", round(shape.y)],
        ["stroke", colors.divider],
        ["stroke-width", width],
        ...dash,
      ],
      undefined,
    ),
  );
  if (shape.label.length > 0) {
    const center = (shape.x1 + shape.x2) / 2;
    parts.push(renderLine(shape.label, center, shape.y - 8, "middle", fonts.size, colors.dividerText, measure, 600));
  }
  return parts.join("");
}

function renderDelay(shape: DelayShape, measure: TextMeasure): string {
  const parts: string[] = [];
  for (let offset = -1; offset <= 1; offset += 1) {
    parts.push(
      el("circle", [
        ["cx", round(shape.x)],
        ["cy", round(shape.y + offset * 7)],
        ["r", 1.8],
        ["fill", colors.delay],
      ], undefined),
    );
  }
  if (shape.label.length > 0) {
    parts.push(renderLine(shape.label, shape.x + 12, shape.y + 5, "start", fonts.size, colors.delay, measure, 0));
  }
  return parts.join("");
}

function renderSection(shape: SectionShape, measure: TextMeasure): string {
  const parts: string[] = [];
  parts.push(
    el(
      "rect",
      [
        ["x", round(shape.x)],
        ["y", round(shape.y)],
        ["width", round(shape.w)],
        ["height", round(shape.h)],
        ["rx", 5],
        ["fill", colors.sectionFill],
        ["fill-opacity", 0.55],
        ["stroke", colors.sectionStroke],
        ["stroke-width", 1],
      ],
      undefined,
    ),
  );
  for (const branch of shape.branches) {
    if (branch.separatorY > 0) {
      parts.push(
        el(
          "line",
          [
            ["x1", round(shape.x)],
            ["y1", round(branch.separatorY)],
            ["x2", round(shape.x + shape.w)],
            ["y2", round(branch.separatorY)],
            ["stroke", colors.sectionStroke],
            ["stroke-width", 1],
            ["stroke-dasharray", "4 4"],
          ],
          undefined,
        ),
      );
    }
    if (branch.label.length > 0) {
      parts.push(renderLine(branch.label, shape.x + 9, branch.labelY, "start", fonts.size, colors.sectionText, measure, 0));
    }
  }
  return parts.join("");
}

function renderShape(shape: Shape, measure: TextMeasure): string {
  switch (shape.kind) {
    case "arrow":
      return renderArrow(shape, measure);
    case "note":
      return renderNote(shape, measure);
    case "divider":
      return renderDivider(shape, measure);
    case "delay":
      return renderDelay(shape, measure);
    case "section":
      return renderSection(shape, measure);
  }
}

export function renderSvg(layout: Layout, measure: TextMeasure = estimateMeasure): string {
  const parts: string[] = [];
  parts.push(
    el(
      "rect",
      [
        ["x", 0],
        ["y", 0],
        ["width", layout.width],
        ["height", layout.height],
        ["fill", colors.background],
      ],
      undefined,
    ),
  );

  if (layout.hasTitle) {
    parts.push(
      renderLine(layout.title, layout.width / 2, layout.titleY, "middle", fonts.titleSize, colors.actorText, measure, 600),
    );
  }

  for (const shape of layout.shapes) {
    if (shape.kind === "section") {
      parts.push(renderSection(shape, measure));
    }
  }

  for (const actor of layout.actors) {
    parts.push(
      el(
        "line",
        [
          ["x1", round(actor.center)],
          ["y1", round(layout.lifelineTop)],
          ["x2", round(actor.center)],
          ["y2", round(layout.lifelineBottom)],
          ["stroke", colors.lifeline],
          ["stroke-width", 1],
        ],
        undefined,
      ),
    );
  }

  const renderActorRow = (top: number): void => {
    for (const actor of layout.actors) {
      parts.push(
        el(
          "rect",
          [
            ["x", round(actor.left)],
            ["y", round(top)],
            ["width", round(actor.right - actor.left)],
            ["height", layout.actorBottom - layout.actorTop],
            ["rx", 6],
            ["fill", colors.actorFill],
            ["stroke", colors.actorStroke],
            ["stroke-width", 1],
          ],
          undefined,
        ),
      );
      parts.push(
        renderLine(
          actor.label,
          actor.center,
          top + (layout.actorBottom - layout.actorTop) / 2 + 5,
          "middle",
          fonts.size,
          colors.actorText,
          measure,
          0,
        ),
      );
    }
  };

  renderActorRow(layout.actorTop);
  renderActorRow(layout.bottomTop);

  for (const shape of layout.shapes) {
    if (shape.kind !== "section") {
      parts.push(renderShape(shape, measure));
    }
  }

  const body = parts.join("");
  return el(
    "svg",
    [
      ["xmlns", "http://www.w3.org/2000/svg"],
      ["xmlns:xlink", "http://www.w3.org/1999/xlink"],
      ["viewBox", `0 0 ${layout.width} ${layout.height}`],
      ["width", layout.width],
      ["height", layout.height],
      ["font-family", fonts.family],
    ],
    body,
  );
}

export function diagramToSvg(diagram: Diagram, measure?: TextMeasure): string {
  const activeMeasure = measure === undefined ? estimateMeasure : measure;
  return renderSvg(layoutDiagram(diagram, activeMeasure), activeMeasure);
}
