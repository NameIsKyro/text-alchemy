import type { TextAlchemySettings } from "./types";
import { sortByMode } from "./sorting";
import {
  addDividersBetweenHeadings,
  addParagraphSpacing,
  cleanWikiLinks,
  fixPdfLineBreaks,
  linesToBulletList,
  linesToChecklist,
  linesToMarkdownLinks,
  linesToNumberedList,
  plainLinesToWikiLinks,
  removeBulletsAndNumbering,
  removeDuplicatesHard,
  removeDuplicatesSoft,
  removeGapsBetweenLines,
  removeHyphenatedLineBreaks,
  renumberNumberedList,
  spaceHeadings,
  trimLineWhitespace
} from "./transforms";

export function runPipeline(text: string, settings: TextAlchemySettings): string {
  const steps: ((value: string) => string)[] = [];

  if (settings.pipeline.removeHyphenatedLineBreaks) steps.push(removeHyphenatedLineBreaks);
  if (settings.pipeline.fixPdfLineBreaks) steps.push(fixPdfLineBreaks);
  if (settings.pipeline.trimWhitespace) steps.push(trimLineWhitespace);
  if (settings.pipeline.removeGapsBetweenLines) steps.push(removeGapsBetweenLines);
  if (settings.duplicateMode === "soft") steps.push(removeDuplicatesSoft);
  if (settings.duplicateMode === "hard") steps.push(removeDuplicatesHard);
  if (settings.pipeline.wikiLinkCleaner) steps.push(cleanWikiLinks);
  if (settings.pipeline.convertPlainLinesToWikiLinks) steps.push(plainLinesToWikiLinks);
  if (settings.pipeline.convertLinesToMarkdownLinks) steps.push(linesToMarkdownLinks);
  if (settings.pipeline.removeBulletsAndNumbering) steps.push(removeBulletsAndNumbering);
  if (settings.sortMode !== "off") steps.push((value) => sortByMode(value, settings.sortMode));
  if (settings.pipeline.renumberNumberedList) steps.push((value) => renumberNumberedList(value, settings.numberedListStart));
  if (settings.pipeline.turnLinesIntoBulletList) steps.push((value) => linesToBulletList(value, settings.bulletMarker));
  if (settings.pipeline.turnLinesIntoNumberedList) steps.push((value) => linesToNumberedList(value, settings.numberedListStart));
  if (settings.pipeline.turnLinesIntoChecklist) steps.push(linesToChecklist);
  if (settings.pipeline.addParagraphSpacing) steps.push(addParagraphSpacing);
  if (settings.pipeline.spaceCustomHeadings) steps.push((value) => spaceHeadings(value, settings.customHeadingLevels));
  if (settings.pipeline.addCustomHeadingDividers) {
    steps.push((value) => addDividersBetweenHeadings(
      value,
      settings.dividerHeadingLevels,
      settings.addBlankLinesAroundDivider
    ));
  }

  return steps.reduce((value, step) => step(value), text);
}
