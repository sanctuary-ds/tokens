import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { REPORT, paletteLines, publicApi, report, tokenLines } from '../scripts/api.js';

const read = (file) => JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'));
const lines = (text) => text.split('\n').filter((line) => line && !line.startsWith('#'));
// The report lists each line once, so compare what a change leaves in it, not how often.
const unique = (names) => [...new Set(names)].sort();

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
      removed.length > 0 ? `Removed, a breaking change (see docs/public-api.md):\n${list(removed)}` : '',
      added.length > 0 ? `Added:\n${list(added)}` : '',
    ].filter(Boolean).join('\n'),
  );
});

test('a palette key removed from a single flavor changes the report', () => {
  const palette = read('dist/palette.json');
  const before = paletteLines(palette);
  delete palette.flavors.matins.colors.surface;
  assert.notDeepEqual(unique(paletteLines(palette)), unique(before));
});

test('a token removed from a single flavor file changes the report', () => {
  const files = { 'flavor/lauds.tokens.json': read('tokens/flavor/lauds.tokens.json'), 'flavor/matins.tokens.json': read('tokens/flavor/matins.tokens.json') };
  const before = tokenLines(files);
  delete files['flavor/matins.tokens.json'].surface.sunken;
  assert.notDeepEqual(unique(tokenLines(files)), unique(before));
});
