import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { oklchToHex, hexToOklch, contrast } from '../src/color.js';
import { FLAVORS, PIGMENTS, TONES, WINDOW_TONES, buildPalette, harmony } from '../src/palette.js';
import { buildTokens, cssName, flatten, resolveHex } from '../src/tokens.js';
import { emitCss } from '../src/emit/css.js';
import { emitPorts } from '../src/emit/ports.js';

const palette = buildPalette();
const tokens = buildTokens(palette);
const flavorIds = Object.keys(FLAVORS);
const pigmentIds = Object.keys(PIGMENTS);
const data = JSON.parse(readFileSync(new URL('../dist/palette.json', import.meta.url), 'utf8'));

test('oklch converts to the sRGB hex given in the DTCG color module example', () => {
  assert.equal(oklchToHex([0.7016, 0.3225, 328.363]), '#ff00ff');
});

test('hex round-trips through oklch', () => {
  for (const hex of ['#000000', '#ffffff', '#3b6fd4', '#c0392b', '#f2c94c']) {
    assert.equal(oklchToHex(hexToOklch(hex)), hex);
  }
});

test('contrast matches the WCAG extremes', () => {
  assert.equal(contrast('#000000', '#ffffff'), 21);
  assert.equal(contrast('#777777', '#777777'), 1);
});

test('every pigment has a full ramp of in-gamut, strictly darkening tones', () => {
  for (const id of pigmentIds) {
    const ramp = palette.pigments[id];
    assert.deepEqual(Object.keys(ramp).map(Number), TONES);
    let previous = 2;
    for (const tone of TONES) {
      assert.match(ramp[tone].hex, /^#[0-9a-f]{6}$/);
      // Gamut mapping must not have clipped: the hex has to decode to the same color.
      const [l, c, h] = hexToOklch(ramp[tone].hex);
      const [expectedL, expectedC, expectedH] = ramp[tone].oklch;
      assert.ok(Math.abs(l - expectedL) < 0.006, `${id}.${tone} lightness clipped`);
      assert.ok(Math.abs(c - expectedC) < 0.004, `${id}.${tone} chroma clipped`);
      // Hue is only meaningful with some chroma; 8-bit rounding moves it by up to about 2°.
      const hueShift = Math.abs(((h - expectedH + 540) % 360) - 180);
      if (expectedC > 0.02) assert.ok(hueShift < 3, `${id}.${tone} hue shifted by ${hueShift.toFixed(1)}°`);
      assert.ok(l < previous, `${id}.${tone} is not darker than the previous tone`);
      previous = l;
    }
  }
});

test('text and accent roles meet WCAG AA against the surfaces of every flavor', () => {
  for (const flavor of flavorIds) {
    const hex = (path) => resolveHex(tokens, flavor, path);
    const surfaces = ['surface', 'surface.sunken', 'surface.raised-1', 'surface.raised-2', 'surface.raised-3', 'surface.raised-4'];
    const pass = (fg, bg) => {
      const ratio = contrast(hex(fg), hex(bg));
      assert.ok(ratio >= 4.5, `${flavor}: ${fg} on ${bg} is ${ratio.toFixed(2)}`);
    };
    for (const surface of surfaces) {
      for (const text of ['text', 'text.muted', 'text.subtle']) pass(text, surface);
    }
    // Every pairing the site's glass roles promise (/docs/foundations/color, /docs/accessibility).
    // Lume is light, not text, so it has no text guarantee; on sunken stone, accent text uses ink.
    for (const id of pigmentIds) {
      const glass = `glass.${id}`;
      for (const surface of surfaces) {
        if (surface !== 'surface.sunken') pass(glass, surface);
        pass(`${glass}.ink`, surface);
      }
      pass(`${glass}.ink`, `${glass}.pane`);
      pass(`${glass}.on`, glass);
      pass(`${glass}.on-pane`, `${glass}.pane`);
    }
  }
});

test('the focus halo is drawn in the accent, which clears 3:1 against its stone band', () => {
  const css = emitCss(palette, tokens);
  assert.match(css, /--san-halo: 0 0 0 2px var\(--san-surface\), 0 0 0 4px var\(--san-accent\);/);
  for (const flavor of flavorIds) {
    const hex = (path) => resolveHex(tokens, flavor, path);
    for (const id of pigmentIds) {
      const ratio = contrast(hex(`glass.${id}`), hex('surface'));
      assert.ok(ratio >= 3, `${flavor}: halo in ${id} is ${ratio.toFixed(2)}`);
    }
  }
});

test('DTCG token files are structurally valid and every alias resolves', () => {
  for (const [file, tree] of Object.entries(tokens.files)) {
    for (const { path, token, type } of flatten(tree)) {
      assert.ok(type, `${file}: ${path.join('.')} has no $type`);
      for (const segment of path) {
        assert.ok(segment === '$root' || !/^\$|[{}.]/.test(segment), `${file}: bad name ${segment}`);
      }
      if (type === 'color' && typeof token.$value === 'object') {
        assert.equal(token.$value.colorSpace, 'oklch');
        assert.equal(token.$value.components.length, 3);
        assert.match(token.$value.hex, /^#[0-9a-f]{6}$/);
      }
    }
  }
  for (const flavor of flavorIds) {
    for (const { path, type } of flatten(tokens.files[`flavor/${flavor}.tokens.json`])) {
      if (type === 'color') assert.match(resolveHex(tokens, flavor, path.join('.')), /^#[0-9a-f]{6}$/);
    }
  }
});

test('the stylesheet exposes every flavor, accent, glazing and window switch', () => {
  const css = emitCss(palette, tokens);
  for (const flavor of flavorIds) assert.ok(css.includes(`[data-san-flavor="${flavor}"]`), flavor);
  for (const id of pigmentIds) assert.ok(css.includes(`[data-san-accent="${id}"]`), id);
  // The shipped glazings and window modes are public API: removing one must fail here, not only in the CSS.
  const glazings = ['pot-metal', 'flashed', 'grisaille'];
  assert.deepEqual(Object.keys(palette.glazings), glazings);
  for (const id of glazings) assert.ok(css.includes(`[data-san-glazing="${id}"]`), id);
  const windowModes = ['mono', 'harmonic'];
  assert.deepEqual(Object.keys(palette.windowModes), windowModes);
  for (const id of windowModes) assert.ok(css.includes(`[data-san-window="${id}"]`), id);
  // Named windows are fixed gradients to place by hand, not a theme-wide switch.
  for (const id of Object.keys(palette.windows)) {
    assert.ok(css.includes(`--san-window-${id}: linear-gradient(`), id);
    assert.ok(!css.includes(`[data-san-window="${id}"]`), `${id} must not be a switch`);
  }
  // Every custom property that is read must also be declared somewhere.
  const declared = new Set([...css.matchAll(/(--san-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
  for (const [, name] of css.matchAll(/var\((--san-[a-z0-9-]+)/g)) {
    assert.ok(declared.has(name), `${name} is used but never declared`);
  }
});

test('a glazing declared in the palette without CSS fails the build instead of shipping silently', () => {
  const glazings = { ...palette.glazings, stained: { name: 'Stained', note: 'Not implemented.' } };
  assert.throws(() => emitCss({ ...palette, glazings }, tokens), /glazing "stained"/);
});

test('a field name keeps one type across the published palette tables', () => {
  for (const window of Object.values(palette.windows)) assert.ok(Array.isArray(window.stops));
  for (const [id, mode] of Object.entries(palette.windowModes)) {
    assert.equal(mode.stops, undefined, `${id} describes its light in source, not stops`);
    assert.equal(typeof mode.source, 'string', id);
  }
});

test('a window mode declared in the palette without CSS fails the build instead of shipping silently', () => {
  const windowModes = { ...palette.windowModes, prism: { name: 'Prism', source: 'every pigment', note: 'Not implemented.' } };
  assert.throws(() => emitCss({ ...palette, windowModes }, tokens), /window mode "prism"/);
});

test('the palette data names the default of every theme axis', () => {
  // The defaults are public API: a consumer applies them before the user has chosen anything.
  assert.equal(data.defaultFlavor, 'compline');
  assert.equal(data.defaultGlazing, 'pot-metal');
  assert.equal(data.defaultWindow, 'mono');
  assert.ok(data.defaultGlazing in data.glazings);
  assert.ok(data.defaultWindow in data.windowModes);
});

test('the palette data lists each font family with exactly the weights the type scale uses', () => {
  const families = tokens.files['foundation/typography.tokens.json'].font.family;
  const scale = tokens.files['foundation/typography.tokens.json'].type;
  assert.deepEqual(Object.keys(data.fonts), Object.keys(families).filter((key) => !key.startsWith('$')));
  for (const [id, font] of Object.entries(data.fonts)) {
    const stack = families[id].$value;
    assert.equal(font.family, stack[0], id);
    assert.deepEqual(font.fallbacks, stack.slice(1, -1), id);
    assert.equal(font.generic, stack.at(-1), id);
    const used = Object.values(scale)
      .filter((role) => role.$value?.fontFamily === `{font.family.${id}}`)
      .map((role) => role.$value.fontWeight);
    assert.deepEqual(font.weights, [...new Set(used)].sort((a, b) => a - b), id);
    assert.deepEqual(font.styles, ['normal'], id);
  }
});

test('every font in the palette data has the stylesheet variable of the same name', () => {
  // Consumers that host their own fonts map fonts.<role> onto --san-font-family-<role>.
  const css = emitCss(palette, tokens);
  for (const [role, font] of Object.entries(data.fonts)) {
    const declared = css.match(new RegExp(`--san-font-family-${role}: ([^;]+);`));
    assert.ok(declared, `--san-font-family-${role} is not declared`);
    assert.ok(declared[1].startsWith(`"${font.family}"`) || declared[1].startsWith(font.family), role);
  }
});

test('under reduced motion every duration token collapses to zero', () => {
  const css = emitCss(palette, tokens);
  const at = css.indexOf('@media (prefers-reduced-motion: reduce)');
  assert.ok(at >= 0, 'no reduced-motion rule in the stylesheet');
  const reduced = css.slice(at);
  // The names come from the motion tokens, not from the stylesheet, so no duration can be missed.
  const durations = flatten(tokens.files['foundation/motion.tokens.json'])
    .filter(({ type }) => type === 'duration')
    .map(({ path }) => cssName(path));
  assert.ok(durations.length > 0);
  for (const name of durations) assert.match(reduced, new RegExp(`${name}: 0ms;`), name);
});

test('white light is a token, and the glass sheen is drawn with it', () => {
  const css = emitCss(palette, tokens);
  assert.match(css, /--san-light: oklch\(1 0 0\);/);
  const sheen = css.match(/--san-glaze-sheen: ([^;]+);/)[1];
  assert.ok(sheen.includes('var(--san-light)'), sheen);
  assert.ok(!/oklch\(1 0 0 \//.test(css), 'white light written as a literal');
});

test('the npm package ships only the stylesheet, the palette and the token files', (t) => {
  // pnpm sets npm_execpath for the scripts it runs; a bare `node --test` cannot pack, so it skips.
  // CI and the release workflow run `pnpm test`, where this check always runs.
  const pnpm = process.env.npm_execpath;
  if (!pnpm || !/pnpm/.test(pnpm)) return t.skip('run through pnpm to check the package contents');
  const [command, args] = /\.c?js$/.test(pnpm)
    ? [process.execPath, [pnpm, 'pack', '--dry-run', '--json']]
    : [pnpm, ['pack', '--dry-run', '--json']];
  const result = spawnSync(command, args, { cwd: fileURLToPath(new URL('..', import.meta.url)), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  // pnpm may print lifecycle output before the JSON result, so parse from its first brace.
  const start = result.stdout.indexOf('{');
  assert.ok(start >= 0, `pnpm pack printed no JSON:\n${result.stdout}`);
  const { files } = JSON.parse(result.stdout.slice(start));
  const roots = [...new Set(files.map(({ path }) => path.split('/')[0]))].sort();
  assert.deepEqual(roots, ['LICENSE', 'README.md', 'dist', 'package.json', 'tokens']);
});

test('the harmonic window leads each accent with its two neighbors on the hue wheel', () => {
  assert.deepEqual(harmony('cobalt'), ['azure', 'cobalt', 'indigo']);
  // The wheel is circular: rose (3°) sits between murrey (342°) and ruby (24°).
  assert.deepEqual(harmony('ruby'), ['rose', 'ruby', 'ember']);
  assert.deepEqual(harmony('rose'), ['murrey', 'rose', 'ruby']);

  const css = emitCss(palette, tokens);
  const blockOf = (selector) => css.slice(css.indexOf(selector), css.indexOf('}', css.indexOf(selector)));
  const stops = (id) => harmony(id).map((pigment, i) => `--san-harmony-${'abc'[i]}: var(--san-pigment-${pigment}-${WINDOW_TONES[i]});`);
  for (const id of pigmentIds) {
    for (const stop of stops(id)) assert.ok(blockOf(`[data-san-accent="${id}"]`).includes(stop), `${id}: ${stop}`);
  }
  // A flavor's default accent needs its harmony too, before any accent attribute is set.
  for (const flavor of flavorIds) {
    for (const stop of stops(FLAVORS[flavor].accent)) assert.ok(blockOf(`[data-san-flavor="${flavor}"] {`).includes(stop), `${flavor}: ${stop}`);
  }
  const harmonic = blockOf('[data-san-window="harmonic"]');
  for (const stop of 'abc') assert.ok(harmonic.includes(`--san-window-${stop}: var(--san-harmony-${stop});`), stop);
  // Mono is the default and can also be set explicitly, to opt out inside a harmonic scope.
  assert.ok(blockOf('[data-san-window="mono"]').includes('--san-window-b: var(--san-accent);'));
});

test('the default flavor is declared first so that any flavor attribute on the root overrides it', () => {
  const css = emitCss(palette, tokens);
  const rootAt = css.indexOf(':root,\n[data-san-flavor=');
  assert.ok(rootAt > 0, 'default flavor block not found');
  for (const flavor of flavorIds) {
    assert.ok(css.indexOf(`[data-san-flavor="${flavor}"] {`) > rootAt, `${flavor} is declared before the default`);
  }
});

test('every port ships one theme per flavor with sixteen ANSI colors', () => {
  const ports = emitPorts(palette, tokens);
  for (const app of ['kitty', 'ghostty', 'alacritty', 'base16', 'gtk', 'hyprland']) {
    const files = Object.keys(ports).filter((file) => file.startsWith(`${app}/`));
    assert.equal(files.length, flavorIds.length, app);
  }
  for (const flavor of flavorIds) {
    const kitty = ports[`kitty/sanctuary-${flavor}.conf`];
    assert.equal([...kitty.matchAll(/^color\d+\s+#[0-9a-f]{6}$/gm)].length, 16);
    // URLs are text, so they use the text-safe ink role rather than lume.
    assert.match(kitty, new RegExp(`^url_color\\s+${resolveHex(tokens, flavor, 'accent.ink')}$`, 'm'));
  }
});

test('committed build outputs are up to date with the sources', () => {
  const script = fileURLToPath(new URL('../scripts/build.js', import.meta.url));
  execFileSync(process.execPath, [script, '--check'], { stdio: 'pipe' });
});

test('the build check fails on a generated file that the sources no longer produce', () => {
  const repo = fileURLToPath(new URL('..', import.meta.url));
  const copy = mkdtempSync(join(tmpdir(), 'sanctuary-check-'));
  try {
    for (const dir of ['scripts', 'src', 'tokens', 'ports', 'dist']) cpSync(join(repo, dir), join(copy, dir), { recursive: true });
    cpSync(join(repo, 'package.json'), join(copy, 'package.json'));
    writeFileSync(join(copy, 'ports/kitty/sanctuary-old.conf'), '# left behind by a renamed flavor\n');
    writeFileSync(join(copy, 'ports/kitty/.DS_Store'), '');
    const result = spawnSync(process.execPath, [join(copy, 'scripts/build.js'), '--check'], { encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /ports\/kitty\/sanctuary-old\.conf/);
    assert.doesNotMatch(result.stderr, /\.DS_Store/, 'hidden files are not build output');
  } finally {
    rmSync(copy, { recursive: true, force: true });
  }
});
