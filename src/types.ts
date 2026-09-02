export const ALL_HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const;

export type HeadingLevel = (typeof ALL_HEADING_LEVELS)[number];
export type BulletMarker = "-" | "*" | "+";
export type DateFormat = "YYYY-MM-DD" | "YYYY/MM/DD" | "DD/MM/YYYY" | "MM/DD/YYYY" | "DD/MM/YY" | "MM/DD/YY" | "DD-MM-YYYY" | "MM-DD-YYYY";
export type DateMarkStyle = "friendly" | "plainDate" | "linkDate" | "none";
export type DuplicateMode = "off" | "soft" | "hard";
export type SortMode = "off" | "linesAz" | "linesZa" | "headingsAz" | "titleLinesAz";
export type WeekStart = "monday" | "sunday";

export interface PipelineSettings {
  trimWhitespace: boolean;
  removeGapsBetweenLines: boolean;
  addParagraphSpacing: boolean;
  spaceCustomHeadings: boolean;
  addCustomHeadingDividers: boolean;
  removeHyphenatedLineBreaks: boolean;
  fixPdfLineBreaks: boolean;
  wikiLinkCleaner: boolean;
  convertPlainLinesToWikiLinks: boolean;
  convertLinesToMarkdownLinks: boolean;
  removeBulletsAndNumbering: boolean;
  renumberNumberedList: boolean;
  turnLinesIntoBulletList: boolean;
  turnLinesIntoNumberedList: boolean;
  turnLinesIntoChecklist: boolean;
}

export interface TextAlchemySettings {
  fallbackToWholeNote: boolean;
  ignoreYamlFrontmatter: boolean;
  ignoreCodeBlocks: boolean;
  customHeadingLevels: HeadingLevel[];
  dividerHeadingLevels: HeadingLevel[];
  addBlankLinesAroundDivider: boolean;
  bulletMarker: BulletMarker;
  dateSuggestionsEnabled: boolean;
  dateLinkFormat: DateFormat;
  datePlainFormat: DateFormat;
  dateMarkStyle: DateMarkStyle;
  dateWeekStart: WeekStart;
  numberedListStart: number;
  duplicateMode: DuplicateMode;
  sortMode: SortMode;
  pipeline: PipelineSettings;
}

export const PIPELINE_TOOL_LABELS: Record<keyof PipelineSettings, string> = {
  trimWhitespace: "Trim line whitespace",
  removeGapsBetweenLines: "Remove gaps between lines",
  addParagraphSpacing: "Add paragraph spacing",
  spaceCustomHeadings: "Space selected heading levels",
  addCustomHeadingDividers: "Add dividers between selected heading levels",
  removeHyphenatedLineBreaks: "Remove hyphenated line breaks",
  fixPdfLineBreaks: "Fix copied PDF line breaks",
  wikiLinkCleaner: "Clean wiki links",
  convertPlainLinesToWikiLinks: "Convert plain lines to wiki links",
  convertLinesToMarkdownLinks: "Convert lines to Markdown links",
  removeBulletsAndNumbering: "Remove bullets and numbering",
  renumberNumberedList: "Re-number numbered list",
  turnLinesIntoBulletList: "Turn lines into bullet list",
  turnLinesIntoNumberedList: "Turn lines into numbered list",
  turnLinesIntoChecklist: "Turn lines into checklist"
};

export const PIPELINE_TOOL_INFO: Record<keyof PipelineSettings, string> = {
  trimWhitespace: "Info: Removes spaces before and after every line. Example: \"  [[Milk]]  \" becomes \"[[Milk]]\".",
  removeGapsBetweenLines: "Info: Removes empty lines between items. Example: a spaced-out link list becomes tight consecutive lines.",
  addParagraphSpacing: "Info: Adds one empty line between paragraphs or lines. Example: \"Milk\" then \"Cheese\" becomes separated by one blank line.",
  spaceCustomHeadings: "Info: Adds one blank line before and after the heading levels selected below. Example: \"# A\" then text becomes spaced cleanly.",
  addCustomHeadingDividers: "Info: Adds a Markdown divider between selected heading levels. Example: two top-level headings get a --- line between them.",
  removeHyphenatedLineBreaks: "Info: Joins words split across lines by a hyphen. Example: \"ferment-\" then \"ation\" becomes \"fermentation\".",
  fixPdfLineBreaks: "Info: Joins copied PDF text into normal paragraphs. Example: three wrapped lines become one clean paragraph.",
  wikiLinkCleaner: "Info: Tidies wiki-link lines. Example: \" [[Raw milk.pdf]]  \" becomes \"[[Raw milk.pdf]]\".",
  convertPlainLinesToWikiLinks: "Info: Wraps each plain line in wiki-link brackets. Example: \"Milk\" becomes \"[[Milk]]\".",
  convertLinesToMarkdownLinks: "Info: Converts label-url lines to Markdown links. Example: \"Google - https://google.com\" becomes \"[Google](https://google.com)\".",
  removeBulletsAndNumbering: "Info: Removes list markers. Example: \"- Milk\" and \"7. Cheese\" become \"Milk\" and \"Cheese\".",
  renumberNumberedList: "Info: Fixes messy numbered lists. Example: \"1. Milk\" then \"7. Cheese\" becomes \"1. Milk\" then \"2. Cheese\".",
  turnLinesIntoBulletList: "Info: Adds bullet markers to each line. Example: \"Milk\" becomes \"- Milk\".",
  turnLinesIntoNumberedList: "Info: Adds numbers to each line. Example: \"Milk\" then \"Cheese\" becomes \"1. Milk\" then \"2. Cheese\".",
  turnLinesIntoChecklist: "Info: Adds unchecked task boxes. Example: \"Milk\" becomes \"- [ ] Milk\"."
};

export const DATE_FORMAT_LABELS: Record<DateFormat, string> = {
  "YYYY-MM-DD": "YYYY-MM-DD",
  "YYYY/MM/DD": "YYYY/MM/DD",
  "DD/MM/YYYY": "DD/MM/YYYY",
  "MM/DD/YYYY": "MM/DD/YYYY",
  "DD/MM/YY": "DD/MM/YY",
  "MM/DD/YY": "MM/DD/YY",
  "DD-MM-YYYY": "DD-MM-YYYY",
  "MM-DD-YYYY": "MM-DD-YYYY"
};

export const DATE_MARK_STYLE_LABELS: Record<DateMarkStyle, string> = {
  friendly: "Friendly mark",
  plainDate: "Plain date",
  linkDate: "Linked date",
  none: "No mark"
};

export const WEEK_START_LABELS: Record<WeekStart, string> = {
  monday: "Monday",
  sunday: "Sunday"
};

export const SORT_MODE_LABELS: Record<SortMode, string> = {
  off: "No sorting",
  linesAz: "Sort lines A to Z",
  linesZa: "Sort lines Z to A",
  headingsAz: "Sort headings A to Z",
  titleLinesAz: "Sort title lines A to Z"
};

export const PIPELINE_KEYS: (keyof PipelineSettings)[] = [
  "trimWhitespace",
  "removeGapsBetweenLines",
  "addParagraphSpacing",
  "spaceCustomHeadings",
  "addCustomHeadingDividers",
  "removeHyphenatedLineBreaks",
  "fixPdfLineBreaks",
  "wikiLinkCleaner",
  "convertPlainLinesToWikiLinks",
  "convertLinesToMarkdownLinks",
  "removeBulletsAndNumbering",
  "renumberNumberedList",
  "turnLinesIntoBulletList",
  "turnLinesIntoNumberedList",
  "turnLinesIntoChecklist"
];

export const DEFAULT_PIPELINE: PipelineSettings = {
  trimWhitespace: true,
  removeGapsBetweenLines: false,
  addParagraphSpacing: false,
  spaceCustomHeadings: false,
  addCustomHeadingDividers: false,
  removeHyphenatedLineBreaks: false,
  fixPdfLineBreaks: false,
  wikiLinkCleaner: false,
  convertPlainLinesToWikiLinks: false,
  convertLinesToMarkdownLinks: false,
  removeBulletsAndNumbering: false,
  renumberNumberedList: false,
  turnLinesIntoBulletList: false,
  turnLinesIntoNumberedList: false,
  turnLinesIntoChecklist: false
};

export const DEFAULT_SETTINGS: TextAlchemySettings = {
  fallbackToWholeNote: true,
  ignoreYamlFrontmatter: true,
  ignoreCodeBlocks: true,
  customHeadingLevels: [1],
  dividerHeadingLevels: [...ALL_HEADING_LEVELS],
  addBlankLinesAroundDivider: true,
  bulletMarker: "-",
  dateSuggestionsEnabled: true,
  dateLinkFormat: "YYYY-MM-DD",
  datePlainFormat: "DD/MM/YYYY",
  dateMarkStyle: "friendly",
  dateWeekStart: "monday",
  numberedListStart: 1,
  duplicateMode: "off",
  sortMode: "off",
  pipeline: DEFAULT_PIPELINE
};

export function normalizeSettings(settings: Partial<TextAlchemySettings>): TextAlchemySettings {
  return {
    fallbackToWholeNote: settings.fallbackToWholeNote !== false,
    ignoreYamlFrontmatter: settings.ignoreYamlFrontmatter !== false,
    ignoreCodeBlocks: settings.ignoreCodeBlocks !== false,
    customHeadingLevels: normalizeHeadingLevels(settings.customHeadingLevels, [1]),
    dividerHeadingLevels: normalizeHeadingLevels(settings.dividerHeadingLevels, [...ALL_HEADING_LEVELS]),
    addBlankLinesAroundDivider: settings.addBlankLinesAroundDivider !== false,
    bulletMarker: isBulletMarker(settings.bulletMarker) ? settings.bulletMarker : "-",
    dateSuggestionsEnabled: settings.dateSuggestionsEnabled !== false,
    dateLinkFormat: isDateFormat(settings.dateLinkFormat) ? settings.dateLinkFormat : "YYYY-MM-DD",
    datePlainFormat: isDateFormat(settings.datePlainFormat) ? settings.datePlainFormat : "DD/MM/YYYY",
    dateMarkStyle: isDateMarkStyle(settings.dateMarkStyle) ? settings.dateMarkStyle : "friendly",
    dateWeekStart: isWeekStart(settings.dateWeekStart) ? settings.dateWeekStart : "monday",
    numberedListStart: normalizeStartNumber(settings.numberedListStart),
    duplicateMode: isDuplicateMode(settings.duplicateMode) ? settings.duplicateMode : "off",
    sortMode: isSortMode(settings.sortMode) ? settings.sortMode : "off",
    pipeline: normalizePipeline(settings.pipeline)
  };
}

export function normalizeHeadingLevels(levels: unknown, fallback: HeadingLevel[]): HeadingLevel[] {
  if (!Array.isArray(levels)) {
    return fallback;
  }

  const normalized = levels
    .map((level) => Number.parseInt(String(level), 10))
    .filter(isHeadingLevel);

  return Array.from(new Set(normalized)).sort((a, b) => a - b);
}

export function isBulletMarker(value: unknown): value is BulletMarker {
  return value === "-" || value === "*" || value === "+";
}

export function isDateFormat(value: unknown): value is DateFormat {
  return value === "YYYY-MM-DD"
    || value === "YYYY/MM/DD"
    || value === "DD/MM/YYYY"
    || value === "MM/DD/YYYY"
    || value === "DD/MM/YY"
    || value === "MM/DD/YY"
    || value === "DD-MM-YYYY"
    || value === "MM-DD-YYYY";
}

export function isDateMarkStyle(value: unknown): value is DateMarkStyle {
  return value === "friendly" || value === "plainDate" || value === "linkDate" || value === "none";
}

export function isDuplicateMode(value: unknown): value is DuplicateMode {
  return value === "off" || value === "soft" || value === "hard";
}

export function isHeadingLevel(value: number): value is HeadingLevel {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5 || value === 6;
}

export function isPipelineKey(value: string): value is keyof PipelineSettings {
  return PIPELINE_KEYS.some((key) => key === value);
}

export function isSortMode(value: unknown): value is SortMode {
  return value === "off"
    || value === "linesAz"
    || value === "linesZa"
    || value === "headingsAz"
    || value === "titleLinesAz";
}

export function isWeekStart(value: unknown): value is WeekStart {
  return value === "monday" || value === "sunday";
}

function normalizePipeline(pipeline: Partial<PipelineSettings> | undefined): PipelineSettings {
  const normalized = { ...DEFAULT_PIPELINE, ...(pipeline ?? {}) };

  for (const key of Object.keys(DEFAULT_PIPELINE) as (keyof PipelineSettings)[]) {
    normalized[key] = normalized[key] === true;
  }

  return normalized;
}

function normalizeStartNumber(startAt: unknown): number {
  const parsed = typeof startAt === "number" ? startAt : Number.parseInt(String(startAt), 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}
