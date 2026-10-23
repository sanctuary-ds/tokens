#!/usr/bin/env node
// Builds every generated artefact from src/. `--check` verifies them instead of writing.

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { emitCss } from '../src/emit/css.js';
import { DEFAULT_FLAVOR, DEFAULT_GLAZING, DEFAULT_WINDOW, PIGMENTS, TONES, buildPalette } from '../src/palette.js';
import { buildTokens, flatten, resolveToken } from '../src/tokens.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

// Directories whose every file is generated, so anything else in them is left over. Only
// `--check` reports leftovers: the build itself never deletes files it did not write.
// Hidden files such as .DS_Store belong to the operating system or an editor, not the build.
const GENERATED_DIRS = ['tokens', 'dist'];

const filesIn = (dir) =>
  existsSync(join(root, dir))
    ? readdirSync(join(root, dir), { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => relative(root, join(entry.parentPath, entry.name)).split('\\').join('/'))
        .filter((file) => !file.split('/').some((segment) => segment.startsWith('.')))
    : [];

/** Each font family with the weights the type scale uses, so a consumer loads exactly those. */
function fontData(tokens) {
  const { font, type } = tokens.files['foundation/typography.tokens.json'];
  const roles = Object.values(type).filter((role) => role.$value);
  return Object.fromEntries(
    Object.entries(font.family)
      .filter(([id]) => !id.startsWith('$'))
      .map(([id, { $value: stack }]) => {
        const weights = roles.filter((role) => role.$value.fontFamily === `{font.family.${id}}`).map((role) => role.$value.fontWeight);
        return [id, {
          family: stack[0],
          fallbacks: stack.slice(1, -1),
          generic: stack.at(-1),
          weights: [...new Set(weights)].sort((a, b) => a - b),
          // The type scale sets no italics; add a style here when a role starts using one.
          styles: ['normal'],
        }];
      }),
  );
}

/** The resolved palette as plain data, for tools that want colors without a token pipeline. */
function paletteData(palette, tokens) {
  const flavors = {};
  for (const [id, flavor] of Object.entries(palette.flavors)) {
    const colors = {};
    for (const { path, type } of flatten(tokens.files[`flavor/${id}.tokens.json`])) {
      if (type !== 'color') continue;
      const { hex, components, alpha } = resolveToken(tokens, id, path).$value;
      const name = path.filter((segment) => segment !== '$root').join('-');
      colors[name] = { hex, oklch: components, ...(alpha === undefined ? {} : { alpha }) };
    }
    const { name, hour, scheme, blurb, accent } = flavor;
    flavors[id] = { name, hour, scheme, blurb, accent, colors };
  }
  const pigments = {};
  for (const [id, ramp] of Object.entries(palette.pigments)) {
    pigments[id] = { ...PIGMENTS[id], tones: Object.fromEntries(TONES.map((tone) => [tone, ramp[tone].hex])) };
  }
  return {
    defaultFlavor: DEFAULT_FLAVOR,
    defaultGlazing: DEFAULT_GLAZING,
    defaultWindow: DEFAULT_WINDOW,
    flavors,
    pigments,
    windows: palette.windows,
    windowModes: palette.windowModes,
    glazings: palette.glazings,
    fonts: fontData(tokens),
  };
}

function outputs() {
  const palette = buildPalette();
  const tokens = buildTokens(palette);
  const data = paletteData(palette, tokens);
  const files = { 'tokens/sanctuary.resolver.json': json(tokens.resolver) };
  for (const [file, tree] of Object.entries(tokens.files)) files[`tokens/${file}`] = json(tree);
  files['dist/css/sanctuary.css'] = emitCss(palette, tokens);
  files['dist/palette.json'] = json(data);
  return files;
}

const check = process.argv.includes('--check');
const stale = [];
const files = outputs();
for (const [file, content] of Object.entries(files)) {
  const target = join(root, file);
  if (check) {
    let current = null;
    try {
      current = readFileSync(target, 'utf8');
    } catch {
      // A missing file is stale.
    }
    if (current !== content) stale.push(file);
  } else {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
}

const orphans = check ? GENERATED_DIRS.flatMap(filesIn).filter((file) => !(file in files)).sort() : [];
const list = (paths) => paths.map((file) => `  ${file}`).join('\n');
if (stale.length > 0) console.error(`Stale generated files, run \`pnpm run build\`:\n${list(stale)}`);
if (orphans.length > 0) console.error(`Generated files the sources no longer produce, delete them:\n${list(orphans)}`);
if (stale.length > 0 || orphans.length > 0) process.exit(1);
console.log(`${check ? 'Verified' : 'Wrote'} ${Object.keys(files).length} files.`);
