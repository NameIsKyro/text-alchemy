import { App, PluginSettingTab, Setting } from "obsidian";
import type { HeadingLevel, PipelineSettings, TextAlchemySettings } from "./types";
import type { Plugin, SettingDefinition, SettingDefinitionItem, SettingGroupItem } from "obsidian";
import {
  ALL_HEADING_LEVELS,
  PIPELINE_KEYS,
  PIPELINE_TOOL_INFO,
  PIPELINE_TOOL_LABELS,
  SORT_MODE_LABELS,
  isBulletMarker,
  isDuplicateMode,
  isHeadingLevel,
  isPipelineKey,
  isSortMode
} from "./types";

export interface TextAlchemySettingsHost extends Plugin {
  settings: TextAlchemySettings;
  saveSettings(): Promise<void>;
}

export class TextAlchemySettingTab extends PluginSettingTab {
  private readonly plugin: TextAlchemySettingsHost;

  constructor(app: App, plugin: TextAlchemySettingsHost) {
    super(app, plugin);
    this.plugin = plugin;
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        type: "group",
        cls: "text-alchemy-settings",
        heading: "Behavior",
        items: [
          createToggleDefinition(
            "fallbackToWholeNote",
            "Whole-note fallback",
            "Info: If no text is selected, individual commands clean the whole active note. Example: run trim whitespace with no selection to trim every line in the note.",
            true
          ),
          createToggleDefinition(
            "ignoreYamlFrontmatter",
            "Ignore YAML frontmatter",
            "Info: Protects the metadata block at the top of a note. Example: title, tags, and aliases inside --- stay exactly as they are.",
            true
          ),
          createToggleDefinition(
            "ignoreCodeBlocks",
            "Ignore code blocks",
            "Info: Protects fenced markdown code blocks. Example: text inside ```md stays unchanged while the rest of the note is cleaned.",
            true
          )
        ]
      },
      {
        type: "group",
        cls: "text-alchemy-settings",
        heading: "Cleaner",
        items: [
          ...PIPELINE_KEYS.map((key) => createToggleDefinition(
            `pipeline.${key}`,
            PIPELINE_TOOL_LABELS[key],
            PIPELINE_TOOL_INFO[key],
            false
          )),
          createDropdownDefinition(
            "duplicateMode",
            "Duplicate handling in cleaner",
            "Info: Off keeps duplicates. Soft removes repeats and adds a duplicates section. Hard only removes repeats.",
            "off",
            {
              off: "Off",
              soft: "Soft",
              hard: "Hard"
            }
          )
        ]
      },
      {
        type: "group",
        cls: "text-alchemy-settings",
        heading: "Sorting",
        items: [
          createDropdownDefinition(
            "sortMode",
            "Cleaner sort mode",
            "Info: Pick one optional sort step for the cleaner pipeline. Example: lines a to z sorts milk, bread, cheese into bread, cheese, milk.",
            "off",
            SORT_MODE_LABELS
          )
        ]
      },
      {
        type: "group",
        cls: "text-alchemy-settings",
        heading: "Lists",
        items: [
          createDropdownDefinition(
            "bulletMarker",
            "Bullet marker",
            "Info: Pick the marker used when turning lines into bullets. Example with '-': milk becomes - milk.",
            "-",
            {
              "-": "-",
              "*": "*",
              "+": "+"
            }
          ),
          createNumberDefinition(
            "numberedListStart",
            "Numbered list start",
            "Info: Pick the first number used for numbered lists and re-numbering. Example with 3: milk becomes 3. Milk.",
            1
          )
        ]
      },
      {
        type: "group",
        cls: "text-alchemy-settings",
        heading: "Heading spacing",
        items: buildHeadingDefinitions("customHeadingLevels", "spacing")
      },
      {
        type: "group",
        cls: "text-alchemy-settings",
        heading: "Heading dividers",
        items: [
          ...buildHeadingDefinitions("dividerHeadingLevels", "divider"),
          createToggleDefinition(
            "addBlankLinesAroundDivider",
            "Blank lines around dividers",
            "Info: Adds empty lines around ---. Example on: heading, blank line, ---, blank line, heading. Example off: heading, ---, heading.",
            true
          )
        ]
      }
    ];
  }

  getControlValue(key: string): unknown {
    if (key.startsWith("pipeline.")) {
      const pipelineKey = key.slice("pipeline.".length);
      return isPipelineKey(pipelineKey) ? this.plugin.settings.pipeline[pipelineKey] : undefined;
    }

    const spacingLevel = readHeadingLevelKey(key, "customHeadingLevels");

    if (spacingLevel !== null) {
      return this.plugin.settings.customHeadingLevels.includes(spacingLevel);
    }

    const dividerLevel = readHeadingLevelKey(key, "dividerHeadingLevels");

    if (dividerLevel !== null) {
      return this.plugin.settings.dividerHeadingLevels.includes(dividerLevel);
    }

    if (key === "fallbackToWholeNote") return this.plugin.settings.fallbackToWholeNote;
    if (key === "ignoreYamlFrontmatter") return this.plugin.settings.ignoreYamlFrontmatter;
    if (key === "ignoreCodeBlocks") return this.plugin.settings.ignoreCodeBlocks;
    if (key === "addBlankLinesAroundDivider") return this.plugin.settings.addBlankLinesAroundDivider;
    if (key === "bulletMarker") return this.plugin.settings.bulletMarker;
    if (key === "numberedListStart") return this.plugin.settings.numberedListStart;
    if (key === "duplicateMode") return this.plugin.settings.duplicateMode;
    if (key === "sortMode") return this.plugin.settings.sortMode;

    return undefined;
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    if (key.startsWith("pipeline.")) {
      const pipelineKey = key.slice("pipeline.".length);

      if (isPipelineKey(pipelineKey)) {
        this.plugin.settings.pipeline[pipelineKey] = value === true;
      }
    } else if (key === "fallbackToWholeNote") {
      this.plugin.settings.fallbackToWholeNote = value === true;
    } else if (key === "ignoreYamlFrontmatter") {
      this.plugin.settings.ignoreYamlFrontmatter = value === true;
    } else if (key === "ignoreCodeBlocks") {
      this.plugin.settings.ignoreCodeBlocks = value === true;
    } else if (key === "addBlankLinesAroundDivider") {
      this.plugin.settings.addBlankLinesAroundDivider = value === true;
    } else if (key === "bulletMarker" && isBulletMarker(value)) {
      this.plugin.settings.bulletMarker = value;
    } else if (key === "duplicateMode" && isDuplicateMode(value)) {
      this.plugin.settings.duplicateMode = value;
    } else if (key === "sortMode" && isSortMode(value)) {
      this.plugin.settings.sortMode = value;
    } else if (key === "numberedListStart") {
      this.plugin.settings.numberedListStart = normalizeStartValue(value);
    } else {
      const spacingLevel = readHeadingLevelKey(key, "customHeadingLevels");
      const dividerLevel = readHeadingLevelKey(key, "dividerHeadingLevels");

      if (spacingLevel !== null) {
        this.plugin.settings.customHeadingLevels = setHeadingLevelValue(
          this.plugin.settings.customHeadingLevels,
          spacingLevel,
          value === true
        );
      } else if (dividerLevel !== null) {
        this.plugin.settings.dividerHeadingLevels = setHeadingLevelValue(
          this.plugin.settings.dividerHeadingLevels,
          dividerLevel,
          value === true
        );
      }
    }

    await this.plugin.saveSettings();
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("text-alchemy-settings");

    new Setting(containerEl)
      .setName("Behavior")
      .setHeading();

    new Setting(containerEl)
      .setName("Whole-note fallback")
      .setDesc("Info: If no text is selected, individual commands clean the whole active note. Example: run trim whitespace with no selection to trim every line in the note.")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.fallbackToWholeNote)
          .onChange(async (value) => {
            this.plugin.settings.fallbackToWholeNote = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Ignore YAML frontmatter")
      .setDesc("Info: Protects the metadata block at the top of a note. Example: title, tags, and aliases inside --- stay exactly as they are.")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.ignoreYamlFrontmatter)
          .onChange(async (value) => {
            this.plugin.settings.ignoreYamlFrontmatter = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Ignore code blocks")
      .setDesc("Info: Protects fenced markdown code blocks. Example: text inside ```md stays unchanged while the rest of the note is cleaned.")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.ignoreCodeBlocks)
          .onChange(async (value) => {
            this.plugin.settings.ignoreCodeBlocks = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Cleaner")
      .setHeading();

    for (const key of Object.keys(PIPELINE_TOOL_LABELS) as (keyof PipelineSettings)[]) {
      new Setting(containerEl)
        .setName(PIPELINE_TOOL_LABELS[key])
        .setDesc(PIPELINE_TOOL_INFO[key])
        .addToggle((toggle) => {
          toggle
            .setValue(this.plugin.settings.pipeline[key])
            .onChange(async (value) => {
              this.plugin.settings.pipeline[key] = value;
              await this.plugin.saveSettings();
            });
        });
    }

    new Setting(containerEl)
      .setName("Duplicate handling in cleaner")
      .setDesc("Info: Off keeps duplicates. Soft removes repeats and adds a duplicates section. Hard only removes repeats.")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("off", "Off")
          .addOption("soft", "Soft")
          .addOption("hard", "Hard")
          .setValue(this.plugin.settings.duplicateMode)
          .onChange(async (value) => {
            this.plugin.settings.duplicateMode = value === "soft" || value === "hard" ? value : "off";
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Sorting")
      .setHeading();

    new Setting(containerEl)
      .setName("Cleaner sort mode")
      .setDesc("Info: Pick one optional sort step for the cleaner pipeline. Example: lines a to z sorts milk, bread, cheese into bread, cheese, milk.")
      .addDropdown((dropdown) => {
        for (const [value, label] of Object.entries(SORT_MODE_LABELS)) {
          dropdown.addOption(value, label);
        }

        dropdown
          .setValue(this.plugin.settings.sortMode)
          .onChange(async (value) => {
            this.plugin.settings.sortMode = isSortMode(value) ? value : "off";
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Lists")
      .setHeading();

    new Setting(containerEl)
      .setName("Bullet marker")
      .setDesc("Info: Pick the marker used when turning lines into bullets. Example with '-': milk becomes - milk.")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("-", "-")
          .addOption("*", "*")
          .addOption("+", "+")
          .setValue(this.plugin.settings.bulletMarker)
          .onChange(async (value) => {
            this.plugin.settings.bulletMarker = value === "*" || value === "+" ? value : "-";
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Numbered list start")
      .setDesc("Info: Pick the first number used for numbered lists and re-numbering. Example with 3: milk becomes 3. Milk.")
      .addText((text) => {
        text
          .setPlaceholder("1")
          .setValue(String(this.plugin.settings.numberedListStart))
          .onChange(async (value) => {
            const parsed = Number.parseInt(value, 10);
            this.plugin.settings.numberedListStart = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Heading spacing")
      .setHeading();

    addHeadingLevelToggles(
      containerEl,
      () => this.plugin.settings.customHeadingLevels,
      "spacing",
      async (levels) => {
        this.plugin.settings.customHeadingLevels = levels;
        await this.plugin.saveSettings();
      }
    );

    new Setting(containerEl)
      .setName("Heading dividers")
      .setHeading();

    addHeadingLevelToggles(
      containerEl,
      () => this.plugin.settings.dividerHeadingLevels,
      "divider",
      async (levels) => {
        this.plugin.settings.dividerHeadingLevels = levels;
        await this.plugin.saveSettings();
      }
    );

    new Setting(containerEl)
      .setName("Blank lines around dividers")
      .setDesc("Info: Adds empty lines around ---. Example on: Heading, blank line, ---, blank line, heading. Example off: Heading, ---, heading.")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.addBlankLinesAroundDivider)
          .onChange(async (value) => {
            this.plugin.settings.addBlankLinesAroundDivider = value;
            await this.plugin.saveSettings();
          });
      });
  }
}

function addHeadingLevelToggles(
  containerEl: HTMLElement,
  getSelectedLevels: () => HeadingLevel[],
  mode: "spacing" | "divider",
  onChange: (levels: HeadingLevel[]) => Promise<void>
): void {
  for (const level of ALL_HEADING_LEVELS) {
    new Setting(containerEl)
      .setName(`H${level} ${"#".repeat(level)}`)
      .setDesc(getHeadingLevelInfo(level, mode))
      .addToggle((toggle) => {
        toggle
          .setValue(getSelectedLevels().includes(level))
          .onChange(async (value) => {
            const nextLevels = new Set(getSelectedLevels());

            if (value) {
              nextLevels.add(level);
            } else {
              nextLevels.delete(level);
            }

            await onChange(Array.from(nextLevels).sort((a, b) => a - b));
          });
      });
  }
}

function createToggleDefinition(key: string, name: string, desc: string, defaultValue: boolean): SettingDefinition {
  return {
    name,
    desc,
    control: {
      type: "toggle",
      key,
      defaultValue
    }
  };
}

function createDropdownDefinition(
  key: string,
  name: string,
  desc: string,
  defaultValue: string,
  options: Record<string, string>
): SettingDefinition {
  return {
    name,
    desc,
    control: {
      type: "dropdown",
      key,
      defaultValue,
      options
    }
  };
}

function createNumberDefinition(key: string, name: string, desc: string, defaultValue: number): SettingDefinition {
  return {
    name,
    desc,
    control: {
      type: "number",
      key,
      defaultValue,
      min: 1,
      step: 1
    }
  };
}

function buildHeadingDefinitions(prefix: "customHeadingLevels" | "dividerHeadingLevels", mode: "spacing" | "divider"): SettingGroupItem[] {
  return ALL_HEADING_LEVELS.map((level) => createToggleDefinition(
    `${prefix}.${level}`,
    `H${level} ${"#".repeat(level)}`,
    getHeadingLevelInfo(level, mode),
    prefix === "customHeadingLevels" ? level === 1 : true
  ));
}

function getHeadingLevelInfo(level: HeadingLevel, mode: "spacing" | "divider"): string {
  const marker = "#".repeat(level);
  const sampleHeading = `${marker} Example`;

  if (mode === "divider") {
    return `Info: Applies heading dividers to H${level} lines. Example: two "${sampleHeading}" sections get a --- divider between them.`;
  }

  return `Info: Applies custom heading spacing to H${level} lines. Example: "${sampleHeading}" gets one blank line around it.`;
}

function readHeadingLevelKey(key: string, prefix: "customHeadingLevels" | "dividerHeadingLevels"): HeadingLevel | null {
  if (!key.startsWith(`${prefix}.`)) {
    return null;
  }

  const parsedLevel = Number.parseInt(key.slice(prefix.length + 1), 10);
  return isHeadingLevel(parsedLevel) ? parsedLevel : null;
}

function setHeadingLevelValue(levels: HeadingLevel[], level: HeadingLevel, enabled: boolean): HeadingLevel[] {
  const nextLevels = new Set(levels);

  if (enabled) {
    nextLevels.add(level);
  } else {
    nextLevels.delete(level);
  }

  return Array.from(nextLevels).sort((a, b) => a - b);
}

function normalizeStartValue(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}
