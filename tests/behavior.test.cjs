const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");
const bundlePath = path.join(rootDir, "main.js");
const bundleCode = fs.readFileSync(bundlePath, "utf8");
const commands = [];
const notices = [];

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

  async loadData() {
    return null;
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

const sandbox = {
  console,
  exports: {},
  module: { exports: {} },
  require(name) {
    if (name === "obsidian") {
      return {
        Notice: NoticeMock,
        Plugin: PluginMock,
        PluginSettingTab: PluginSettingTabMock,
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

function getCommand(id) {
  const command = commands.find((item) => item.id === id);
  assert.ok(command, `Missing command: ${id}`);
  return command;
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
  assert.ok(commands.every((command) => !command.id.includes("text-alchemy")));

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
  console.log("Behavior tests passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
