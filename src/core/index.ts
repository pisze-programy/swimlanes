/** Public API of the diagram engine. */

export { parseDiagram } from "./parse";
export { parseInline, parseInlineLines } from "./inline";
export { layoutDiagram } from "./layout";
export { renderSvg, diagramToSvg } from "./render";
export { estimateMeasure, lineWidth, runWidth } from "./metrics";
export { parseArrowToken } from "./arrow";
export { lex, classifyLine } from "./lex";
export type { Statement } from "./lex";
export type {
  Layout,
  Shape,
  ArrowShape,
  NoteShape,
  DividerShape,
  DelayShape,
  SectionShape,
  SectionBranchShape,
  LaidOutActor,
} from "./layout";
export type { TextMeasure } from "./metrics";
export type {
  Actor,
  Arrow,
  ArrowHead,
  ArrowLine,
  Block,
  Diagram,
  DividerStyle,
  FaSet,
  FaSize,
  IconRun,
  InlineLine,
  InlineRun,
  LinkRun,
  MessageBlock,
  NoteBlock,
  SectionBlock,
  SectionBranch,
  TextRun,
} from "./model";
