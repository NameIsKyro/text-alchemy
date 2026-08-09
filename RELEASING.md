# Releasing

Use this checklist before publishing a new Text Alchemy release.

1. Update `manifest.json`, `package.json`, and `versions.json` to the same semantic version.
2. Run `npm ci`.
3. Run `npm run lint`.
4. Run `npm run typecheck`.
5. Run `npm test`.
6. Run `npm audit`.
7. Run `npm run build`.
8. Manually load the generated `main.js`, `manifest.json`, and `styles.css` in a test vault.
9. Test selection commands, whole-note fallback, settings reload, dark theme, light theme, and plugin unload/reload.
10. Create a GitHub release whose tag exactly matches the manifest version, with no `v` prefix.
11. Upload `main.js`, `manifest.json`, and `styles.css` as release assets.

`main.js` is generated for local testing and release assets. It is intentionally ignored by Git so the repository keeps source code as the committed build source.
