import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";

const production = process.argv[2] === "production";

const context = await esbuild.context({
  banner: {
    js: "/* Text Alchemy by @NameIsKyro */"
  },
  bundle: true,
  entryPoints: ["src/main.ts"],
  external: [
    "obsidian",
    "electron",
    "@codemirror/*",
    "@lezer/*",
    ...builtins
  ],
  format: "cjs",
  logLevel: "info",
  minify: production,
  outfile: "main.js",
  sourcemap: false,
  target: "es2018",
  treeShaking: true
});

if (production) {
  await context.rebuild();
  await context.dispose();
} else {
  await context.watch();
}
