# Changelog

## 1.3.0

- Fixed `Shift+Enter` date insertion by registering it directly with the suggestion keyboard scope.
- Added independent insertion styles for `Enter` and `Shift+Enter`: `[[date|mark]]`, `[[date|date]]`, `[[date]]`, `date`, and `(date)`.
- Added `@date` expansion for Markdown headings and Obsidian note titles.
- Added separate title date format and title wrapper settings.
- Added a separate setting for turning note-title `@date` expansion on or off.
- Added more slash, hyphen, and dot-separated day-month-year and month-day-year formats.
- Added filename-safe handling that changes `/` to `-` only in Obsidian note titles.
- Added regression tests for modified-key selection, every insertion style, heading dates, and inline title dates.

## 1.2.0

- Added `@` date suggestions for Today, Tomorrow, Yesterday, Next week, Last week, Next month, Last month, Next year, Last year, Start of week, and End of week.
- Added linked date insertion with `Enter`, such as `[[2026-09-02|Today]]`.
- Added plain date insertion with `Shift Enter`, such as `02/09/2026`.
- Added date settings for linked date format, plain date format, date mark style, week start, and date suggestions on or off.
- Added behavior tests for date suggestions, linked insertion, plain insertion, and custom date formats.

## 1.1.1

- Polished the repository for GitHub publication.
- Removed unfinished media placeholders from the README and source package.
- Added GitHub issue templates, pull request template, Dependabot config, contributing guide, and repository metadata.
- Refreshed release assets for version `1.1.1`.

## 1.1.0

- Renamed the combined cleaner and sorter toolkit to Text Alchemy.
- Added community-plugin metadata, release docs, MIT license, ESLint, tests, and TypeScript source layout.
- Added selection-only and whole-note cleaning commands.
- Added cleaner settings with per-tool toggles and short examples.
- Added text cleanup tools for line gaps, whitespace, duplicates, PDF line breaks, hyphenated breaks, wiki links, Markdown links, bullets, checklists, numbering, headings, and dividers.
- Added sorter commands for lines, headings, and title-style lines.
- Added protection for YAML frontmatter and fenced code blocks.
