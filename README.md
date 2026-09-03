# Text Alchemy

Text Alchemy is an Obsidian text cleanup toolkit for turning messy selected text into clean Markdown. It can remove line gaps, trim wiki links, fix copied PDF wrapping, remove duplicates, make lists, re-number lists, space headings, add dividers, sort text from the command palette, and insert quick date links from `@` suggestions.

Created by [@NameIsKyro](https://github.com/NameIsKyro).

## Features

- Remove gaps between lines.
- Add paragraph spacing.
- Add spacing around all headings.
- Add spacing around selected heading levels only.
- Add Markdown dividers between all headings or selected heading levels.
- Trim whitespace from the start and end of every line.
- Remove duplicate lines in soft mode or hard mode.
- Turn lines into bullet lists.
- Turn lines into numbered lists.
- Turn lines into unchecked checklists.
- Remove bullets and numbering.
- Re-number numbered lists.
- Clean wiki-link lines.
- Convert plain lines into wiki links.
- Convert label-url lines into Markdown links.
- Fix copied PDF line breaks.
- Remove hyphenated line breaks.
- Sort lines A to Z or Z to A.
- Sort heading lines A to Z.
- Sort title-style lines A to Z.
- Insert date wiki links from `@today`, `@tomorrow`, `@nextweek`, and more.
- Insert alternate date styles from the same `@` suggestions with `Shift+Enter`.
- Clean selected text only, or clean the entire note.
- Ignore YAML frontmatter.
- Ignore fenced code blocks.

## Examples

Remove gaps between lines:

```md
[[How to Pick the Healthiest Cheeses]]

[[letter to medical professionals about raw milk.pdf]]

[[Life in the Milk A History of Intravenous Milk Injections]]
```

Becomes:

```md
[[How to Pick the Healthiest Cheeses]]
[[letter to medical professionals about raw milk.pdf]]
[[Life in the Milk A History of Intravenous Milk Injections]]
```

Soft duplicate removal:

```md
[[Milk]]
[[Cheese]]
[[Milk]]
[[Bread]]
```

Becomes:

```md
[[Milk]]
[[Cheese]]
[[Bread]]

Duplicates:
[[Milk]]
```

Fix copied PDF line breaks:

```md
Raw milk contains many different
types of bacteria and enzymes that
may be affected by heat.
```

Becomes:

```md
Raw milk contains many different types of bacteria and enzymes that may be affected by heat.
```

Insert a quick date link:

```md
@today
```

Pick `@today` and press `Enter`:

```md
[[2026-09-02|Today]]
```

Pick `@today` and press `Shift+Enter`:

```md
02/09/2026
```

## Commands

- `Clean selected text` - Runs the enabled cleaner pipeline on the current selection.
- `Clean entire note` - Runs the enabled cleaner pipeline on the active note.
- `Remove gaps between lines` - Removes blank lines inside the selected text or whole note.
- `Trim whitespace on each line` - Trims spaces before and after each line.
- `Remove duplicates and list removed lines` - Removes repeated lines and adds a `Duplicates:` section.
- `Remove duplicates only` - Removes repeated lines without adding a duplicate report.
- `Add paragraph spacing` - Keeps one empty line between paragraph blocks.
- `Add spacing around all headings` - Adds one blank line before and after every Markdown heading.
- `Add spacing around selected heading levels` - Adds spacing only around heading levels chosen in settings.
- `Add dividers between all headings` - Adds `---` between matching headings.
- `Add dividers between selected heading levels` - Adds `---` only between chosen heading levels.
- `Turn lines into bullet list` - Adds the configured bullet marker to each non-empty line.
- `Turn lines into numbered list` - Numbers each non-empty line from the configured start number.
- `Turn lines into checklist` - Converts each non-empty line to `- [ ] text`.
- `Remove bullets and numbering` - Removes bullet, checklist, and numbered-list markers.
- `Re-number numbered list` - Rebuilds numbering from the configured start number.
- `Clean wiki links` - Trims wiki-link lines like ` [[Milk]] ` into `[[Milk]]`.
- `Convert plain lines to wiki links` - Wraps each plain line in `[[...]]`.
- `Convert lines to Markdown links` - Converts `Google - https://google.com` into `[Google](https://google.com)`.
- `Fix copied PDF line breaks` - Joins wrapped paragraph lines while keeping blocks separate.
- `Remove hyphenated line breaks` - Converts `ferment-` plus `ation` into `fermentation`.
- `Sort lines A to Z` - Sorts all lines alphabetically.
- `Sort lines Z to A` - Sorts all lines in reverse alphabetical order.
- `Sort headings A to Z` - Sorts heading lines alphabetically and leaves non-heading lines after them.
- `Sort title lines A to Z` - Sorts non-empty title-style lines alphabetically.

No default hotkeys are registered. Add your own hotkeys in Obsidian's Hotkeys settings if you want them.

## Date suggestions

Type `@` in the editor to open date suggestions. `Enter` and `Shift+Enter` each have their own configurable insertion style.

Available insertion styles:

- `[[date|mark]]`, such as `[[2026-09-02|Today]]`.
- `[[date|date]]`, such as `[[2026-09-02|02/09/2026]]`.
- `[[date]]`, such as `[[2026-09-02]]`.
- `date`, such as `02/09/2026`.
- `(date)`, such as `(02/09/2026)`.

Available date suggestions:

- `@today`
- `@date` for title-style dates
- `@tomorrow`
- `@yesterday`
- `@nextweek`
- `@lastweek`
- `@nextmonth`
- `@lastmonth`
- `@nextyear`
- `@lastyear`
- `@startofweek`
- `@endofweek`

Use `@date` in a Markdown heading or Obsidian's inline note title to insert today's date with the dedicated title format and wrapper settings. For example, `# Research @date` can become `# Research (02-09-2026)`. Because `/` is not valid inside an Obsidian filename, slash-based formats are converted to hyphens only in the note title; Markdown headings keep the selected format exactly.

## Settings

The settings tab lets you build a cleaner pipeline by toggling each tool on or off. Every option includes a short Info description and example so you can remember what it does later.

Core settings:

- Whole-note fallback.
- Ignore YAML frontmatter.
- Ignore code blocks.
- Date suggestions.
- Title `@date` expansion.
- Linked date format.
- Plain date format.
- Enter insertion style.
- Shift+Enter insertion style.
- Title date format.
- Title date style.
- Week starts on.
- Duplicate handling: off, soft, or hard.
- Cleaner sort mode.
- Bullet marker.
- Numbered list start.
- Heading levels for custom heading spacing.
- Heading levels for custom dividers.
- Blank lines around dividers.

## Compatibility

- Desktop: supported.
- Mobile: supported by using Obsidian editor APIs and avoiding Node or Electron APIs at runtime.
- Minimum app version: Obsidian `1.5.0`.

## Installation

Install from the community directory when Text Alchemy is listed:

1. Open Settings.
2. Go to Community plugins.
3. Search for Text Alchemy.
4. Install and enable it.

Manual install for testing:

1. Download `main.js`, `manifest.json`, and `styles.css` from a release.
2. Create `<your-vault>/.obsidian/plugins/text-alchemy/`.
3. Put those three files in that folder.
4. Reload Obsidian.
5. Enable Text Alchemy in Community plugins.

## Release files

Each GitHub release should attach exactly these files:

- `main.js`
- `manifest.json`
- `styles.css`

The source repository intentionally does not commit generated release files.

## Privacy

Text Alchemy runs locally in Obsidian. It does not collect telemetry, make network requests, use external accounts, or send note content anywhere.

## Limitations

- PDF cleanup is heuristic and may need a manual pass for tables, citations, poetry, or intentionally line-broken text.
- Heading spacing and dividers target Markdown headings that begin with `#`.
- Sorting commands are line-based and do not preserve nested Markdown structures.
- Whole-note cleanup can make broad changes. Test your enabled pipeline on a small selection first.

## Troubleshooting

- If a command changes too much, turn off whole-note fallback and run it on selected text only.
- If code examples are being changed, enable Ignore code blocks.
- If frontmatter changes, enable Ignore YAML frontmatter.
- If the cleaner pipeline does not do anything, make sure at least one cleaner option is enabled.

## Development

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

`npm run build` creates `main.js` for local testing and release uploads. The generated `main.js` file is intentionally ignored by Git.

## Release

See `RELEASING.md` for the release checklist.

## License

MIT. See `LICENSE`.

## Support

Open an issue at https://github.com/NameIsKyro/text-alchemy/issues.
