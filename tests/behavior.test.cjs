const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");
const bundlePath = path.join(rootDir, "main.js");
const bundleCode = fs.readFileSync(bundlePath, "utf8");
const commands = [];
const editorSuggests = [];
const domEvents = [];
const notices = [];
let savedPluginData = null;
let selectedDateToken = null;
const fixedNow = new Date("2026-09-02T12:00:00.000Z");

class FixedDate extends Date {
  constructor(...args) {
    super(...(args.length === 0 ? [fixedNow.getTime()] : args));
  }

  static now() {
    return fixedNow.getTime();
  }
}

class PluginMock {
  constructor() {
    this.app = {};
  }

  addCommand(command) {
    commands.push(command);
  }

  addSettingTab(settingTab) {
    this.settingTab = settingTab;
  }

  registerEditorSuggest(editorSuggest) {
    editorSuggests.push(editorSuggest);
  }

  registerDomEvent(element, type, callback, options) {
    domEvents.push({ element, type, callback, options });
  }

  async loadData() {
    return savedPluginData;
  }

  async saveData(data) {
    this.savedData = data;
  }
}

class NoticeMock {
  constructor(message) {
    notices.push(message);
  }
}

class PluginSettingTabMock {
  constructor(app, plugin) {
    this.app = app;
    this.plugin = plugin;
    this.containerEl = {
      addClass() {},
      empty() {}
    };
  }
}

class EditorSuggestMock {
  constructor(app) {
    this.app = app;
    this.context = null;
    this.instructions = [];
    this.scope = {
      handlers: [],
      register: (modifiers, key, callback) => {
        const handler = { modifiers, key, callback };
        this.scope.handlers.push(handler);
        return handler;
      }
    };
  }

  setInstructions(instructions) {
    this.instructions = instructions;
  }

  close() {}
}

const documentMock = {
  querySelector() {
    return selectedDateToken
      ? { dataset: { textAlchemyDateToken: selectedDateToken } }
      : null;
  }
};

const sandbox = {
  console,
  Date: FixedDate,
  document: documentMock,
  exports: {},
  module: { exports: {} },
  require(name) {
    if (name === "obsidian") {
      return {
        Notice: NoticeMock,
        Plugin: PluginMock,
        PluginSettingTab: PluginSettingTabMock,
        EditorSuggest: EditorSuggestMock,
        Setting: class SettingMock {}
      };
    }

    throw new Error(`Unexpected require: ${name}`);
  }
};

vm.runInNewContext(bundleCode, sandbox, { filename: "main.js" });

const PluginClass = sandbox.module.exports.default ?? sandbox.module.exports;

function createEditor(value, selection = value) {
  let editorValue = value;
  let editorSelection = selection;

  return {
    getSelection() {
      return editorSelection;
    },
    replaceSelection(nextSelection) {
      editorSelection = nextSelection;
      editorValue = nextSelection;
    },
    getValue() {
      return editorValue;
    },
    setValue(nextValue) {
      editorValue = nextValue;
      editorSelection = "";
    },
    read() {
      return editorValue;
    }
  };
}

function createRangeEditor(value) {
  let editorValue = value;
  let cursor = { line: 0, ch: value.length };

  function splitLines() {
    return editorValue.split("\n");
  }

  function positionToOffset(position) {
    const lines = splitLines();
    let offset = 0;

    for (let line = 0; line < position.line; line += 1) {
      offset += lines[line].length + 1;
    }

    return offset + position.ch;
  }

  return {
    getLine(line) {
      return splitLines()[line] ?? "";
    },
    replaceRange(replacement, from, to) {
      const start = positionToOffset(from);
      const end = positionToOffset(to ?? from);
      editorValue = `${editorValue.slice(0, start)}${replacement}${editorValue.slice(end)}`;
      cursor = { line: from.line, ch: from.ch + replacement.length };
    },
    getCursor() {
      return cursor;
    },
    setCursor(nextCursor) {
      cursor = nextCursor;
    },
    read() {
      return editorValue;
    }
  };
}

function getCommand(id) {
  const command = commands.find((item) => item.id === id);
  assert.ok(command, `Missing command: ${id}`);
  return command;
}

function toPlain(value) {
  return JSON.parse(JSON.stringify(value));
}

async function loadPlugin() {
  const plugin = new PluginClass();
  await plugin.onload();
  return plugin;
}

(async () => {
  const plugin = await loadPlugin();

  assert.equal(plugin.settings.ignoreYamlFrontmatter, true);
  assert.equal(plugin.settings.ignoreCodeBlocks, true);
  assert.equal(commands.length, 25);
  assert.equal(editorSuggests.length, 1);
  assert.equal(domEvents.length, 1);
  assert.ok(commands.every((command) => !command.id.includes("text-alchemy")));

  const dateSuggest = editorSuggests[0];
  assert.deepEqual(toPlain(dateSuggest.instructions), [
    { command: "Enter", purpose: "Insert primary date style" },
    { command: "Shift+Enter", purpose: "Insert alternate date style" }
  ]);

  const shiftEnterHandler = dateSuggest.scope.handlers.find((handler) => {
    return handler.key === "Enter" && toPlain(handler.modifiers).includes("Shift");
  });
  assert.ok(shiftEnterHandler, "Expected Shift+Enter to be registered with the suggestion key scope");

  let rangeEditor = createRangeEditor("Pay @tod");
  let trigger = dateSuggest.onTrigger({ line: 0, ch: 8 }, rangeEditor, null);
  assert.deepEqual(toPlain(trigger), { start: { line: 0, ch: 4 }, end: { line: 0, ch: 8 }, query: "tod" });

  let suggestions = dateSuggest.getSuggestions({ ...trigger, editor: rangeEditor, file: null });
  let today = suggestions.find((suggestion) => suggestion.token === "today");
  assert.ok(today, "Expected @today suggestion");
  dateSuggest.context = { ...trigger, editor: rangeEditor, file: null };
  dateSuggest.selectSuggestion(today, { shiftKey: false });
  assert.equal(rangeEditor.read(), "Pay [[2026-09-02|Today]]");

  rangeEditor = createRangeEditor("Due @today");
  trigger = dateSuggest.onTrigger({ line: 0, ch: 10 }, rangeEditor, null);
  suggestions = dateSuggest.getSuggestions({ ...trigger, editor: rangeEditor, file: null });
  today = suggestions.find((suggestion) => suggestion.token === "today");
  assert.ok(today, "Expected @today suggestion for plain insert");
  dateSuggest.context = { ...trigger, editor: rangeEditor, file: null };
  shiftEnterHandler.callback({ shiftKey: true, key: "Enter" });
  assert.equal(rangeEditor.read(), "Due 02/09/2026");

  plugin.settings.dateShiftEnterStyle = "plain";
  rangeEditor = createRangeEditor("Due @");
  trigger = dateSuggest.onTrigger({ line: 0, ch: 5 }, rangeEditor, null);
  dateSuggest.getSuggestions({ ...trigger, editor: rangeEditor, file: null });
  dateSuggest.context = { ...trigger, editor: rangeEditor, file: null };
  selectedDateToken = "tomorrow";
  shiftEnterHandler.callback({ shiftKey: true, key: "Enter" });
  selectedDateToken = null;
  assert.equal(rangeEditor.read(), "Due 03/09/2026");

  plugin.settings.dateEnterStyle = "linkedDate";
  plugin.settings.dateShiftEnterStyle = "parenthesized";
  rangeEditor = createRangeEditor("Logged @today");
  trigger = dateSuggest.onTrigger({ line: 0, ch: 13 }, rangeEditor, null);
  suggestions = dateSuggest.getSuggestions({ ...trigger, editor: rangeEditor, file: null });
  today = suggestions.find((suggestion) => suggestion.token === "today");
  dateSuggest.context = { ...trigger, editor: rangeEditor, file: null };
  dateSuggest.selectSuggestion(today, { shiftKey: false });
  assert.equal(rangeEditor.read(), "Logged [[2026-09-02|02/09/2026]]");

  rangeEditor = createRangeEditor("Logged @today");
  trigger = dateSuggest.onTrigger({ line: 0, ch: 13 }, rangeEditor, null);
  dateSuggest.getSuggestions({ ...trigger, editor: rangeEditor, file: null });
  dateSuggest.context = { ...trigger, editor: rangeEditor, file: null };
  shiftEnterHandler.callback({ shiftKey: true, key: "Enter" });
  assert.equal(rangeEditor.read(), "Logged (02/09/2026)");

  const styleExpectations = {
    linkedFriendly: "[[2026-09-02|Today]]",
    linkedDate: "[[2026-09-02|02/09/2026]]",
    linked: "[[2026-09-02]]",
    plain: "02/09/2026",
    parenthesized: "(02/09/2026)"
  };

  for (const [style, expected] of Object.entries(styleExpectations)) {
    plugin.settings.dateEnterStyle = style;
    rangeEditor = createRangeEditor("@today");
    trigger = dateSuggest.onTrigger({ line: 0, ch: 6 }, rangeEditor, null);
    suggestions = dateSuggest.getSuggestions({ ...trigger, editor: rangeEditor, file: null });
    today = suggestions.find((suggestion) => suggestion.token === "today");
    dateSuggest.context = { ...trigger, editor: rangeEditor, file: null };
    dateSuggest.selectSuggestion(today, { shiftKey: false });
    assert.equal(rangeEditor.read(), expected, `Unexpected output for ${style}`);
  }

  plugin.settings.titleDateFormat = "DD-MM-YYYY";
  plugin.settings.titleDateStyle = "parenthesized";
  rangeEditor = createRangeEditor("# Research @date");
  trigger = dateSuggest.onTrigger({ line: 0, ch: 16 }, rangeEditor, null);
  suggestions = dateSuggest.getSuggestions({ ...trigger, editor: rangeEditor, file: null });
  const titleDate = suggestions.find((suggestion) => suggestion.token === "date");
  assert.ok(titleDate, "Expected @date title suggestion");
  dateSuggest.context = { ...trigger, editor: rangeEditor, file: null };
  dateSuggest.selectSuggestion(titleDate, { shiftKey: false });
  assert.equal(rangeEditor.read(), "# Research (02-09-2026)");

  const titleInputHandler = domEvents.find((event) => event.type === "input");
  assert.ok(titleInputHandler, "Expected inline title input handling");

  const inlineTitle = {
    textContent: "Research @date",
    matches(selector) {
      return selector.includes(".inline-title");
    },
    closest() {
      return this;
    },
    dispatchEvent() {}
  };
  titleInputHandler.callback({ target: inlineTitle });
  assert.equal(inlineTitle.textContent, "Research (02-09-2026)");

  let inputSelection = null;
  let rangeWasUsedForInput = false;
  const titleInput = {
    tagName: "INPUT",
    value: "Research @date",
    matches(selector) {
      return selector.includes("input");
    },
    closest() {
      return this;
    },
    setSelectionRange(start, end) {
      inputSelection = { start, end };
    },
    dispatchEvent() {},
    ownerDocument: {
      defaultView: {
        Event: class EventMock {
          constructor(type, options) {
            this.type = type;
            this.options = options;
          }
        },
        getSelection() {
          return {
            removeAllRanges() {},
            addRange() {}
          };
        }
      },
      createRange() {
        rangeWasUsedForInput = true;
        return {
          selectNodeContents() {},
          collapse() {}
        };
      }
    }
  };
  titleInputHandler.callback({ target: titleInput });
  assert.equal(titleInput.value, "Research (02-09-2026)");
  assert.deepEqual(inputSelection, { start: 21, end: 21 });
  assert.equal(rangeWasUsedForInput, false);

  plugin.settings.titleDateFormat = "DD/MM/YYYY";
  plugin.settings.titleDateStyle = "plain";
  inlineTitle.textContent = "Research @date";
  titleInputHandler.callback({ target: inlineTitle });
  assert.equal(inlineTitle.textContent, "Research 02-09-2026");

  plugin.settings.dateSuggestionsEnabled = false;
  plugin.settings.titleDateExpansionEnabled = true;
  inlineTitle.textContent = "Independent @date";
  titleInputHandler.callback({ target: inlineTitle });
  assert.equal(inlineTitle.textContent, "Independent 02-09-2026");
  plugin.settings.dateSuggestionsEnabled = true;

  plugin.settings.dateLinkFormat = "DD/MM/YYYY";
  plugin.settings.datePlainFormat = "YYYY/MM/DD";
  plugin.settings.dateEnterStyle = "linkedFriendly";
  rangeEditor = createRangeEditor("Plan @nextweek");
  trigger = dateSuggest.onTrigger({ line: 0, ch: 14 }, rangeEditor, null);
  suggestions = dateSuggest.getSuggestions({ ...trigger, editor: rangeEditor, file: null });
  const nextWeek = suggestions.find((suggestion) => suggestion.token === "nextweek");
  assert.ok(nextWeek, "Expected @nextweek suggestion");
  dateSuggest.context = { ...trigger, editor: rangeEditor, file: null };
  dateSuggest.selectSuggestion(nextWeek, { shiftKey: false });
  assert.equal(rangeEditor.read(), "Plan [[09/09/2026|Next week]]");

  let editor = createEditor("[[Milk]]\n\n[[Cheese]]");
  getCommand("remove-gaps-between-lines").editorCallback(editor);
  assert.equal(editor.read(), "[[Milk]]\n[[Cheese]]");

  editor = createEditor(" [[Milk]] \n[[Cheese]]    \n [[Raw milk.pdf]]");
  getCommand("clean-wiki-links").editorCallback(editor);
  assert.equal(editor.read(), "[[Milk]]\n[[Cheese]]\n[[Raw milk.pdf]]");

  editor = createEditor("[[Milk]]\n[[Cheese]]\n[[Milk]]\n[[Bread]]");
  getCommand("remove-duplicates-soft").editorCallback(editor);
  assert.equal(editor.read(), "[[Milk]]\n[[Cheese]]\n[[Bread]]\n\nDuplicates:\n[[Milk]]");

  editor = createEditor("1. Milk\n7. Cheese\n3. Eggs");
  getCommand("renumber-numbered-list").editorCallback(editor);
  assert.equal(editor.read(), "1. Milk\n2. Cheese\n3. Eggs");

  editor = createEditor("Google - https://google.com");
  getCommand("convert-lines-to-markdown-links").editorCallback(editor);
  assert.equal(editor.read(), "[Google](https://google.com)");

  editor = createEditor("Raw milk contains many different\ntypes of bacteria and enzymes that\nmay be affected by heat.");
  getCommand("fix-copied-pdf-line-breaks").editorCallback(editor);
  assert.equal(editor.read(), "Raw milk contains many different types of bacteria and enzymes that may be affected by heat.");

  editor = createEditor("ferment-\nation");
  getCommand("remove-hyphenated-line-breaks").editorCallback(editor);
  assert.equal(editor.read(), "fermentation");

  editor = createEditor("Milk\nBread\nCheese");
  getCommand("sort-lines-az").editorCallback(editor);
  assert.equal(editor.read(), "Bread\nCheese\nMilk");

  editor = createEditor("---\n title:  Milk  \n---\n```md\n  code  \n```\n  body  ", "");
  getCommand("trim-line-whitespace").editorCallback(editor);
  assert.equal(editor.read(), "---\n title:  Milk  \n---\n```md\n  code  \n```\nbody");

  plugin.settings.pipeline.removeGapsBetweenLines = true;
  editor = createEditor("  [[Milk]]  \n\n  [[Cheese]]  ");
  getCommand("clean-selected-text").editorCallback(editor);
  assert.equal(editor.read(), "[[Milk]]\n[[Cheese]]");

  assert.ok(notices.length > 0);

  savedPluginData = {
    dateMarkStyle: "none",
    datePlainFormat: "MM-DD-YYYY"
  };
  const migratedPlugin = await loadPlugin();
  assert.equal(migratedPlugin.settings.dateEnterStyle, "linked");
  assert.equal(migratedPlugin.settings.datePlainFormat, "MM-DD-YYYY");

  console.log("Behavior tests passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
