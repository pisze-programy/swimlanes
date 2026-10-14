/**
 * Data model for a parsed diagram.
 *
 * The model is a plain, readonly tree. Parsing produces it and every later
 * stage (layout, rendering, encoding) consumes it without mutation.
 */

export type FaSet = "solid" | "regular" | "light" | "duotone" | "brand";

export type FaSize = "normal" | "large" | "double";

/** A run of styled text. */
export interface TextRun {
  readonly kind: "text";
  readonly text: string;
  readonly bold: boolean;
  readonly italic: boolean;
  readonly strike: boolean;
  readonly code: boolean;
}

/** A markdown link. */
export interface LinkRun {
  readonly kind: "link";
  readonly text: string;
  readonly href: string;
  readonly bold: boolean;
  readonly italic: boolean;
}

/** A Font Awesome icon. */
export interface IconRun {
  readonly kind: "icon";
  readonly set: FaSet;
  readonly name: string;
  readonly size: FaSize;
}

export type InlineRun = TextRun | LinkRun | IconRun;

/** One logical line of styled text. */
export type InlineLine = readonly InlineRun[];

export type ArrowLine = "solid" | "dashed" | "bold";

export type ArrowHead = "standard" | "open" | "cross" | "bidirectional";

export interface Arrow {
  readonly line: ArrowLine;
  readonly head: ArrowHead;
  /** True when the message flows right to left. */
  readonly reverse: boolean;
}

export interface Actor {
  /** Stable identity used by messages and notes. */
  readonly key: string;
  /** Display name, already parsed to inline runs. */
  readonly label: InlineLine;
}

export interface MessageBlock {
  readonly kind: "message";
  readonly from: string;
  readonly to: string;
  readonly arrow: Arrow;
  readonly label: InlineLine;
  /** Auto number text, empty when numbering is off. */
  readonly number: string;
}

export interface NoteBlock {
  readonly kind: "note";
  readonly start: string;
  readonly end: string;
  readonly lines: readonly InlineLine[];
}

export type DividerStyle = "thin" | "regular" | "dashed" | "bold";

export interface DividerBlock {
  readonly kind: "divider";
  readonly style: DividerStyle;
  readonly label: InlineLine;
}

export interface DelayBlock {
  readonly kind: "delay";
  readonly label: InlineLine;
}

export interface SectionBranch {
  readonly label: InlineLine;
  readonly blocks: readonly Block[];
}

export interface SectionBlock {
  readonly kind: "section";
  readonly type: "if" | "group";
  readonly branches: readonly SectionBranch[];
}

export type Block = MessageBlock | NoteBlock | DividerBlock | DelayBlock | SectionBlock;

export interface Diagram {
  readonly title: InlineLine;
  readonly actors: readonly Actor[];
  readonly blocks: readonly Block[];
}

export const emptyDiagram: Diagram = {
  title: [],
  actors: [],
  blocks: [],
};

export const emptyLine: InlineLine = [];
