/** Visual constants for layout and rendering. Minimal light theme. */

export interface ThemeColors {
  readonly background: string;
  readonly lifeline: string;
  readonly actorFill: string;
  readonly actorStroke: string;
  readonly actorText: string;
  readonly messageLine: string;
  readonly messageText: string;
  readonly noteFill: string;
  readonly noteStroke: string;
  readonly noteText: string;
  readonly sectionFill: string;
  readonly sectionStroke: string;
  readonly sectionText: string;
  readonly divider: string;
  readonly dividerText: string;
  readonly delay: string;
  readonly link: string;
  readonly codeFill: string;
}

export interface ThemeFonts {
  readonly family: string;
  readonly codeFamily: string;
  readonly size: number;
  readonly titleSize: number;
}

export interface LayoutConstants {
  readonly padding: number;
  readonly minWidth: number;
  readonly actorHeight: number;
  readonly actorPaddingX: number;
  readonly actorMinWidth: number;
  readonly actorGap: number;
  readonly actorRadius: number;
  readonly rowHeight: number;
  readonly labelGap: number;
  readonly selfHeight: number;
  readonly selfLoopWidth: number;
  readonly selfLoopHeight: number;
  readonly notePadding: number;
  readonly noteLineHeight: number;
  readonly dividerHeight: number;
  readonly delayHeight: number;
  readonly sectionLabelHeight: number;
  readonly sectionPadding: number;
  readonly sectionBranchGap: number;
  readonly titleLineHeight: number;
  readonly titleGap: number;
  readonly arrowHeadSize: number;
}

export const colors: ThemeColors = {
  background: "#ffffff",
  lifeline: "#c9ced6",
  actorFill: "#ffffff",
  actorStroke: "#b7bec8",
  actorText: "#1f2328",
  messageLine: "#4a525e",
  messageText: "#1f2328",
  noteFill: "#fdf6d8",
  noteStroke: "#e6d9a2",
  noteText: "#1f2328",
  sectionFill: "#f4f7fd",
  sectionStroke: "#b9cdf0",
  sectionText: "#41598c",
  divider: "#8b949e",
  dividerText: "#57606a",
  delay: "#8b949e",
  link: "#0969da",
  codeFill: "#eef1f4",
};

export const fonts: ThemeFonts = {
  family: "'Source Sans 3', 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  codeFamily: "'Source Code Pro', 'SFMono-Regular', Menlo, Consolas, monospace",
  size: 14,
  titleSize: 20,
};

export const metrics: LayoutConstants = {
  padding: 24,
  minWidth: 360,
  actorHeight: 40,
  actorPaddingX: 22,
  actorMinWidth: 110,
  actorGap: 92,
  actorRadius: 6,
  rowHeight: 48,
  labelGap: 16,
  selfHeight: 58,
  selfLoopWidth: 46,
  selfLoopHeight: 26,
  notePadding: 10,
  noteLineHeight: 22,
  dividerHeight: 46,
  delayHeight: 46,
  sectionLabelHeight: 28,
  sectionPadding: 10,
  sectionBranchGap: 8,
  titleLineHeight: 26,
  titleGap: 18,
  arrowHeadSize: 9,
};
