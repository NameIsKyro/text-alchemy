# Contributing

Thanks for wanting to improve Text Alchemy.

## Setup

```sh
npm ci
npm run lint
npm run typecheck
npm test
```

## Pull requests

- Keep changes focused on one behavior or fix.
- Add or update tests when text transformation behavior changes.
- Do not commit `main.js`, `node_modules`, release folders, or vault-local data.
- Keep commands, setting names, and descriptions sentence case.
- Do not add telemetry, remote code, or network requests.

## Manual testing

Before opening a pull request, test at least one selected-text command and one whole-note command in a local Obsidian vault.
