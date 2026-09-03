import { EditorSuggest } from "obsidian";
import type {
  App,
  Editor,
  EditorPosition,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  TFile
} from "obsidian";
import type { DateFormat, DateInsertionStyle, TextAlchemySettings, WeekStart } from "./types";

export interface DateSettingsHost {
  settings: TextAlchemySettings;
}

export interface DateSuggestion {
  token: string;
  label: string;
  description: string;
  resolveDate(now: Date, weekStart: WeekStart): Date;
}

const DATE_SUGGESTIONS: DateSuggestion[] = [
  createDaySuggestion("today", "Today", "Current date", 0),
  createDaySuggestion("date", "Date", "Current date for titles", 0),
  createDaySuggestion("tomorrow", "Tomorrow", "One day from now", 1),
  createDaySuggestion("yesterday", "Yesterday", "One day before now", -1),
  createDaySuggestion("nextweek", "Next week", "Seven days from now", 7),
  createDaySuggestion("lastweek", "Last week", "Seven days before now", -7),
  {
    token: "nextmonth",
    label: "Next month",
    description: "Same day next month",
    resolveDate: (now) => addMonths(now, 1)
  },
  {
    token: "lastmonth",
    label: "Last month",
    description: "Same day last month",
    resolveDate: (now) => addMonths(now, -1)
  },
  {
    token: "nextyear",
    label: "Next year",
    description: "Same day next year",
    resolveDate: (now) => addYears(now, 1)
  },
  {
    token: "lastyear",
    label: "Last year",
    description: "Same day last year",
    resolveDate: (now) => addYears(now, -1)
  },
  {
    token: "startofweek",
    label: "Start of week",
    description: "Start of the current week",
    resolveDate: (now, weekStart) => startOfWeek(now, weekStart)
  },
  {
    token: "endofweek",
    label: "End of week",
    description: "End of the current week",
    resolveDate: (now, weekStart) => addDays(startOfWeek(now, weekStart), 6)
  }
];

export class DateTokenSuggest extends EditorSuggest<DateSuggestion> {
  private readonly plugin: DateSettingsHost;
  private visibleSuggestions: DateSuggestion[] = [];

  constructor(app: App, plugin: DateSettingsHost) {
    super(app);
    this.plugin = plugin;
    this.setInstructions([
      { command: "Enter", purpose: "Insert primary date style" },
      { command: "Shift+Enter", purpose: "Insert alternate date style" }
    ]);
    this.scope.register(["Shift"], "Enter", (evt) => {
      const suggestion = this.getActiveSuggestion();

      if (!suggestion) {
        return;
      }

      this.selectSuggestion(suggestion, evt);
      return false;
    });
  }

  onTrigger(cursor: EditorPosition, editor: Editor, _file: TFile | null): EditorSuggestTriggerInfo | null {
    if (!this.plugin.settings.dateSuggestionsEnabled) {
      return null;
    }

    const line = editor.getLine(cursor.line);
    const beforeCursor = line.slice(0, cursor.ch);
    const atIndex = beforeCursor.lastIndexOf("@");

    if (atIndex === -1 || !canTriggerAfterCharacter(beforeCursor.charAt(atIndex - 1))) {
      return null;
    }

    const query = beforeCursor.slice(atIndex + 1);

    if (!/^[A-Za-z]*$/.test(query)) {
      return null;
    }

    return {
      start: { line: cursor.line, ch: atIndex },
      end: cursor,
      query: query.toLowerCase()
    };
  }

  getSuggestions(context: EditorSuggestContext): DateSuggestion[] {
    if (!this.plugin.settings.dateSuggestionsEnabled) {
      return [];
    }

    const query = context.query.toLowerCase();

    this.visibleSuggestions = DATE_SUGGESTIONS.filter((suggestion) => {
      return suggestion.token.startsWith(query) || suggestion.label.toLowerCase().includes(query);
    });

    return this.visibleSuggestions;
  }

  renderSuggestion(value: DateSuggestion, el: HTMLElement): void {
    el.addClass("text-alchemy-date-suggestion");
    el.dataset.textAlchemyDateToken = value.token;
    el.createDiv({ cls: "text-alchemy-date-suggestion-title", text: `@${value.token}` });
    el.createDiv({ cls: "text-alchemy-date-suggestion-note", text: `${value.label} - ${this.previewDate(value)}` });
  }

  selectSuggestion(value: DateSuggestion, evt: MouseEvent | KeyboardEvent): void {
    if (!this.context) {
      return;
    }

    const replacement = value.token === "date"
      ? formatTitleDate(new Date(), this.plugin.settings, false)
      : formatDateInsertion(
        value,
        evt.shiftKey ? this.plugin.settings.dateShiftEnterStyle : this.plugin.settings.dateEnterStyle,
        this.plugin.settings,
        new Date()
      );

    this.context.editor.replaceRange(replacement, this.context.start, this.context.end);
    this.close();
  }

  private previewDate(value: DateSuggestion): string {
    if (value.token === "date") {
      return formatTitleDate(new Date(), this.plugin.settings, false);
    }

    return formatDateInsertion(value, this.plugin.settings.dateEnterStyle, this.plugin.settings, new Date());
  }

  private getActiveSuggestion(): DateSuggestion | undefined {
    const selectedElement = typeof document === "undefined"
      ? null
      : document.querySelector<HTMLElement>(".text-alchemy-date-suggestion.is-selected");
    const selectedToken = selectedElement?.dataset.textAlchemyDateToken;

    if (selectedToken) {
      const selectedSuggestion = this.visibleSuggestions.find((suggestion) => suggestion.token === selectedToken);

      if (selectedSuggestion) {
        return selectedSuggestion;
      }
    }

    const exactMatch = this.visibleSuggestions.find((suggestion) => suggestion.token === this.context?.query);
    return exactMatch ?? this.visibleSuggestions[0];
  }
}

export function formatLinkedDate(suggestion: DateSuggestion, settings: TextAlchemySettings, now: Date): string {
  return formatDateInsertion(suggestion, "linkedFriendly", settings, now);
}

export function formatDateInsertion(
  suggestion: DateSuggestion,
  style: DateInsertionStyle,
  settings: TextAlchemySettings,
  now: Date
): string {
  const date = suggestion.resolveDate(now, settings.dateWeekStart);
  const linkDate = formatDate(date, settings.dateLinkFormat);
  const plainDate = formatDate(date, settings.datePlainFormat);

  if (style === "linkedDate") return `[[${linkDate}|${plainDate}]]`;
  if (style === "linked") return `[[${linkDate}]]`;
  if (style === "plain") return plainDate;
  if (style === "parenthesized") return `(${plainDate})`;
  return `[[${linkDate}|${suggestion.label}]]`;
}

export function formatDate(date: Date, format: DateFormat): string {
  const year = String(date.getFullYear());
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const shortYear = year.slice(-2);

  return format
    .replace("YYYY", year)
    .replace("YY", shortYear)
    .replace("MM", month)
    .replace("DD", day);
}

export function formatTitleDate(date: Date, settings: TextAlchemySettings, fileNameSafe: boolean): string {
  const formatted = formatDate(date, settings.titleDateFormat);
  const safeDate = fileNameSafe ? formatted.replace(/\//g, "-") : formatted;
  return settings.titleDateStyle === "parenthesized" ? `(${safeDate})` : safeDate;
}

function createDaySuggestion(token: string, label: string, description: string, offsetDays: number): DateSuggestion {
  return {
    token,
    label,
    description,
    resolveDate: (now) => addDays(now, offsetDays)
  };
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function addMonths(date: Date, months: number): Date {
  const targetMonth = date.getMonth() + months;
  const firstOfTargetMonth = new Date(date.getFullYear(), targetMonth, 1);
  const lastDayOfTargetMonth = new Date(
    firstOfTargetMonth.getFullYear(),
    firstOfTargetMonth.getMonth() + 1,
    0
  ).getDate();

  return new Date(
    firstOfTargetMonth.getFullYear(),
    firstOfTargetMonth.getMonth(),
    Math.min(date.getDate(), lastDayOfTargetMonth)
  );
}

function addYears(date: Date, years: number): Date {
  const targetYear = date.getFullYear() + years;
  const targetMonth = date.getMonth();
  const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

  return new Date(targetYear, targetMonth, Math.min(date.getDate(), lastDayOfTargetMonth));
}

function startOfWeek(date: Date, weekStart: WeekStart): Date {
  const firstDay = weekStart === "sunday" ? 0 : 1;
  const day = date.getDay();
  const offset = (day - firstDay + 7) % 7;

  return addDays(date, -offset);
}

function canTriggerAfterCharacter(character: string): boolean {
  return character.length === 0 || /\s|[([{]/.test(character);
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}
