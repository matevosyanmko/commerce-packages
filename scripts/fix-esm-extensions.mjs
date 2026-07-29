// Rewrites extensionless relative import/export specifiers in tsc output to an
// explicit ".js", so the published packages resolve under plain Node ESM.
//
// We build with `moduleResolution: "Bundler"` (see tsconfig.base.json), which lets
// source write `from "./utils"` and emits it verbatim. Bundlers cope; Node does not.
// Until a store force-bundles us via `ssr.noExternal` that difference is invisible,
// which is exactly why it has to be fixed before anything reaches a registry.
//
// Runs over both .js and .d.ts. Idempotent. Fails loudly rather than guessing.
//
//   node scripts/fix-esm-extensions.mjs <dist-dir>

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const root = resolve(process.argv[2] ?? "dist");

// Specifiers already carrying one of these are left alone — that's what makes a
// second run a no-op.
const ALREADY_SUFFIXED = /\.(js|mjs|cjs|json|css|node|wasm)$/i;

// Match the *specifier position* rather than whole statements: the string literal
// always sits next to `from`, `import(` or a bare `import`, however the clause above
// it is wrapped. Group 1 is the prefix we replay verbatim, 2 the quote, 3 the specifier.
const RULES = [
  /(\bfrom\s*)(["'])(\.[^"']*)\2/g, //            import/export ... from "./x"
  /(\bimport\s*\(\s*)(["'])(\.[^"']*)\2/g, //     import("./x"), typeof import("./x")
  /((?:^|\n)\s*import\s+)(["'])(\.[^"']*)\2/g, // side-effect import "./x"
];

const failures = [];

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path);
    return /\.(js|d\.ts)$/.test(entry.name) ? [path] : [];
  });
}

// Resolve against the emitted output, not the source tree. A specifier we cannot
// resolve is either a regex false positive (a literal `from "./x"` inside a string)
// or a genuinely broken import — both are build failures, never silent rewrites.
function rewrite(file, spec) {
  const target = resolve(dirname(file), spec);
  if (existsSync(`${target}.js`)) return `${spec}.js`;
  if (existsSync(target) && statSync(target).isDirectory() && existsSync(join(target, "index.js"))) {
    return `${spec}/index.js`;
  }
  return null;
}

function fixFile(file) {
  const before = readFileSync(file, "utf8");
  let after = before;

  for (const rule of RULES) {
    after = after.replace(rule, (match, prefix, quote, spec) => {
      if (ALREADY_SUFFIXED.test(spec)) return match;
      const fixed = rewrite(file, spec);
      if (fixed === null) {
        failures.push(`${relative(root, file)}: cannot resolve ${JSON.stringify(spec)}`);
        return match;
      }
      return `${prefix}${quote}${fixed}${quote}`;
    });
  }

  if (after === before) return false;
  writeFileSync(file, after);
  return true;
}

const files = walk(root);
let changed = 0;
for (const file of files) if (fixFile(file)) changed += 1;

// Final sweep. Nothing relative may still be extensionless — this catches a target
// tsc elided as well as anything the first pass declined to touch.
for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const rule of RULES) {
    for (const match of text.matchAll(rule)) {
      if (!ALREADY_SUFFIXED.test(match[3])) {
        failures.push(`${relative(root, file)}: unresolved specifier ${JSON.stringify(match[3])}`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error(`fix-esm-extensions: ${failures.length} problem(s) in ${relative(process.cwd(), root)}`);
  for (const failure of [...new Set(failures)]) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(
  `fix-esm-extensions: ${changed}/${files.length} file(s) rewritten in ${relative(process.cwd(), root) || "."}`,
);
