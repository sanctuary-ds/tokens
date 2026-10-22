import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { REPORT, paletteLines, publicApi, report, tokenLines } from '../scripts/api.js';

const read = (file) => JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'));
const lines = (text) => text.split('\n').filter((line) => line && !line.startsWith('#'));
// The report lists each line once, so compare what a change leaves in it, not how often.
const unique = (names) => [...new Set(names)].sort();
/** The lines a change takes out of the report and the lines it puts in. */
const change = (before, after) => ({
  removed: unique(before).filter((line) => !after.includes(line)),
  added: unique(after).filter((line) => !before.includes(line)),
});

test('the public API matches the committed report', () => {
  const committed = readFileSync(new URL(`../${REPORT}`, import.meta.url), 'utf8');
  const current = publicApi();
  const removed = lines(committed).filter((line) => !current.includes(line));
  const added = current.filter((line) => !lines(committed).includes(line));
  const list = (names) => names.map((name) => `  ${name}`).join('\n');
  // Compared as text, so a report that was edited by hand, reordered or duplicated also fails.
  assert.ok(
    committed === report(),
    [
      `The public API differs from ${REPORT}. If the change is intended, run \`pnpm run api\` and commit the report.`,
      removed.length > 0 ? `Removed, a breaking change unless the same names now appear id by id (see docs/public-api.md):\n${list(removed)}` : '',
      added.length > 0 ? `Added:\n${list(added)}` : '',
    ].filter(Boolean).join('\n'),
  );
});

test('a palette key removed from a single flavor changes the report', () => {
  const palette = read('dist/palette.json');
  const before = paletteLines(palette);
  delete palette.flavors.matins.colors.surface;
  // The shared line goes, and the flavors that still have the color are named one by one.
  const names = (flavor) => [`palette flavors.${flavor}.colors.surface.hex`, `palette flavors.${flavor}.colors.surface.oklch`];
  assert.deepEqual(change(before, paletteLines(palette)), {
    removed: names('<flavor>'),
    added: ['compline', 'lauds', 'vespers'].flatMap(names).sort(),
  });
});

test('a token removed from a single flavor file changes the report', () => {
  const files = { 'flavor/lauds.tokens.json': read('tokens/flavor/lauds.tokens.json'), 'flavor/matins.tokens.json': read('tokens/flavor/matins.tokens.json') };
  const before = tokenLines(files);
  delete files['flavor/matins.tokens.json'].surface.sunken;
  assert.deepEqual(change(before, tokenLines(files)), {
    removed: ['token flavor/<flavor>.tokens.json surface.sunken'],
    added: ['token flavor/lauds.tokens.json surface.sunken'],
  });
});

test('a palette key whose value is empty stays in the report', () => {
  assert.deepEqual(unique(paletteLines({ extras: {}, windows: {} })), ['palette extras', 'palette windows']);
});
