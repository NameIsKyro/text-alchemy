const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");

function readJson(fileName) {
  return JSON.parse(fs.readFileSync(path.join(rootDir, fileName), "utf8"));
}

function readText(fileName) {
  return fs.readFileSync(path.join(rootDir, fileName), "utf8");
}

function listSourceFiles(dirName) {
  const dir = path.join(rootDir, dirName);
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const entryPath = path.join(dirName, entry.name);
    return entry.isDirectory() ? listSourceFiles(entryPath) : [entryPath];
  });
}

const manifest = readJson("manifest.json");
const packageJson = readJson("package.json");
const versionsJson = readJson("versions.json");

assert.equal(manifest.id, "text-alchemy");
assert.match(manifest.id, /^[a-z-]+$/);
assert.equal(manifest.id.includes("obsidian"), false);
assert.equal(manifest.id.endsWith("plugin"), false);
assert.equal(manifest.name, "Text Alchemy");
assert.match(manifest.name, /^[\x20-\x7e]+$/);
assert.equal(/\bobsidian\b/i.test(manifest.name), false);
assert.equal(/\bplugin\b/i.test(manifest.name), false);
assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
assert.equal(packageJson.version, manifest.version);
assert.equal(versionsJson[manifest.version], manifest.minAppVersion);
assert.equal(manifest.author, "NameIsKyro");
assert.equal(manifest.authorUrl, "https://github.com/NameIsKyro");
assert.equal(manifest.isDesktopOnly, false);

for (const fileName of [
  "README.md",
  "LICENSE",
  "CHANGELOG.md",
  "RELEASING.md",
  "SECURITY.md",
  "manifest.json",
  "package.json",
  "tsconfig.json",
  "esbuild.config.mjs",
  "styles.css",
  "versions.json"
]) {
  assert.equal(fs.existsSync(path.join(rootDir, fileName)), true, `${fileName} should exist`);
}

assert.match(readText(".gitignore"), /^main\.js$/m);
assert.equal(readText("README.md").includes("/Users/"), false);

for (const sourceFile of listSourceFiles("src")) {
  const source = readText(sourceFile);
  assert.equal(source.includes("innerHTML"), false, `${sourceFile} should avoid innerHTML`);
  assert.equal(source.includes("eval("), false, `${sourceFile} should avoid eval`);
  assert.equal(source.includes("fetch("), false, `${sourceFile} should avoid network calls`);
  assert.equal(source.includes("XMLHttpRequest"), false, `${sourceFile} should avoid network calls`);
}

const styles = readText("styles.css");
assert.equal(/#[0-9a-f]{3,8}/i.test(styles), false);
assert.equal(/\brgba?\(/i.test(styles), false);

console.log("Manifest tests passed");
