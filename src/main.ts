import { Editor, Notice, Plugin } from "obsidian";
import { DateTokenSuggest } from "./date-suggest";
import { applyProtectedTransform, type TextTransform } from "./protection";
import { runPipeline } from "./pipeline";
import { TextAlchemySettingTab } from "./settings-tab";
import { sortHeadingsAZ, sortLinesAZ, sortLinesZA, sortTitleLinesAZ } from "./sorting";
import {
  ALL_HEADING_LEVELS,
  DEFAULT_SETTINGS,
  normalizeSettings,
  type TextAlchemySettings
} from "./types";
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

export default class TextAlchemyPlugin extends Plugin {
  settings: TextAlchemySettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.addCommand({
      id: "clean-selected-text",
      name: "Clean selected text",
      editorCallback: (editor) => {
        this.runCleaner(editor, "selection");
      }
    });

    this.addCommand({
      id: "clean-entire-note",
      name: "Clean entire note",
      editorCallback: (editor) => {
        this.runCleaner(editor, "note");
      }
    });

    this.addTransformCommand("remove-gaps-between-lines", "Remove gaps between lines", removeGapsBetweenLines, "Removed gaps between lines");
    this.addTransformCommand("trim-line-whitespace", "Trim whitespace on each line", trimLineWhitespace, "Trimmed line whitespace");
    this.addTransformCommand("remove-duplicates-soft", "Remove duplicates and list removed lines", removeDuplicatesSoft, "Removed duplicates and listed them");
    this.addTransformCommand("remove-duplicates-hard", "Remove duplicates only", removeDuplicatesHard, "Removed duplicates");
    this.addTransformCommand("add-paragraph-spacing", "Add paragraph spacing", addParagraphSpacing, "Added paragraph spacing");
    this.addTransformCommand("space-all-headings", "Add spacing around all headings", (text) => spaceHeadings(text, [...ALL_HEADING_LEVELS]), "Spaced all headings");
    this.addTransformCommand("space-custom-headings", "Add spacing around selected heading levels", (text) => spaceHeadings(text, this.settings.customHeadingLevels), "Spaced selected heading levels");
    this.addTransformCommand("add-dividers-between-all-headings", "Add dividers between all headings", (text) => addDividersBetweenHeadings(text, [...ALL_HEADING_LEVELS], this.settings.addBlankLinesAroundDivider), "Added dividers between headings");
    this.addTransformCommand("add-dividers-between-custom-headings", "Add dividers between selected heading levels", (text) => addDividersBetweenHeadings(text, this.settings.dividerHeadingLevels, this.settings.addBlankLinesAroundDivider), "Added dividers between selected heading levels");
    this.addTransformCommand("turn-lines-into-bullet-list", "Turn lines into bullet list", (text) => linesToBulletList(text, this.settings.bulletMarker), "Turned lines into a bullet list");
    this.addTransformCommand("turn-lines-into-numbered-list", "Turn lines into numbered list", (text) => linesToNumberedList(text, this.settings.numberedListStart), "Turned lines into a numbered list");
    this.addTransformCommand("turn-lines-into-checklist", "Turn lines into checklist", linesToChecklist, "Turned lines into a checklist");
    this.addTransformCommand("remove-bullets-and-numbering", "Remove bullets and numbering", removeBulletsAndNumbering, "Removed bullets and numbering");
    this.addTransformCommand("renumber-numbered-list", "Re-number numbered list", (text) => renumberNumberedList(text, this.settings.numberedListStart), "Re-numbered numbered list");
    this.addTransformCommand("clean-wiki-links", "Clean wiki links", cleanWikiLinks, "Cleaned wiki links");
    this.addTransformCommand("convert-plain-lines-to-wiki-links", "Convert plain lines to wiki links", plainLinesToWikiLinks, "Converted lines to wiki links");
    this.addTransformCommand("convert-lines-to-markdown-links", "Convert lines to Markdown links", linesToMarkdownLinks, "Converted lines to Markdown links");
    this.addTransformCommand("fix-copied-pdf-line-breaks", "Fix copied PDF line breaks", fixPdfLineBreaks, "Fixed copied PDF line breaks");
    this.addTransformCommand("remove-hyphenated-line-breaks", "Remove hyphenated line breaks", removeHyphenatedLineBreaks, "Removed hyphenated line breaks");
    this.addTransformCommand("sort-lines-az", "Sort lines A to Z", sortLinesAZ, "Sorted lines A to Z");
    this.addTransformCommand("sort-lines-za", "Sort lines Z to A", sortLinesZA, "Sorted lines Z to A");
    this.addTransformCommand("sort-headings-az", "Sort headings A to Z", sortHeadingsAZ, "Sorted headings A to Z");
    this.addTransformCommand("sort-title-lines-az", "Sort title lines A to Z", sortTitleLinesAZ, "Sorted title lines A to Z");

    this.addSettingTab(new TextAlchemySettingTab(this.app, this));
    this.registerEditorSuggest(new DateTokenSuggest(this.app, this));
  }

  async loadSettings(): Promise<void> {
    const savedSettings = await this.loadData() as Partial<TextAlchemySettings> | null;
    this.settings = normalizeSettings({ ...DEFAULT_SETTINGS, ...(savedSettings ?? {}) });
  }

  async saveSettings(): Promise<void> {
    this.settings = normalizeSettings(this.settings);
    await this.saveData(this.settings);
  }

  private addTransformCommand(id: string, name: string, transform: TextTransform, message: string): void {
    this.addCommand({
      id,
      name,
      editorCallback: (editor) => {
        this.transformEditorText(editor, transform, message);
      }
    });
  }

  private runCleaner(editor: Editor, mode: "selection" | "note"): void {
    if (mode === "selection") {
      const selection = editor.getSelection();

      if (selection.length === 0) {
        new Notice("Select text first.");
        return;
      }

      editor.replaceSelection(this.applyProtections(selection, (text) => runPipeline(text, this.settings)));
      new Notice("Cleaned selected text.");
      return;
    }

    editor.setValue(this.applyProtections(editor.getValue(), (text) => runPipeline(text, this.settings)));
    new Notice("Cleaned entire note.");
  }

  private transformEditorText(editor: Editor, transform: TextTransform, message: string): void {
    const protectedTransform = (text: string): string => this.applyProtections(text, transform);
    const selection = editor.getSelection();

    if (selection.length > 0) {
      editor.replaceSelection(protectedTransform(selection));
      new Notice(message);
      return;
    }

    if (!this.settings.fallbackToWholeNote) {
      new Notice("Select text first, or enable whole-note fallback.");
      return;
    }

    editor.setValue(protectedTransform(editor.getValue()));
    new Notice(`${message} in current note.`);
  }

  private applyProtections(text: string, transform: TextTransform): string {
    return applyProtectedTransform(text, transform, this.settings);
  }
}
