import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { REPORT, publicApi } from '../scripts/api.js';

test('the public API matches the committed report', () => {
  const committed = readFileSync(new URL(`../${REPORT}`, import.meta.url), 'utf8')
    .split('\n')
    .filter((line) => line && !line.startsWith('#'));
  const current = publicApi();
  const removed = committed.filter((line) => !current.includes(line));
  const added = current.filter((line) => !committed.includes(line));
  const list = (lines) => lines.map((line) => `  ${line}`).join('\n');
  assert.ok(
    removed.length === 0 && added.length === 0,
    [
      `The public API differs from ${REPORT}. If the change is intended, run \`pnpm run api\` and commit the report.`,
      removed.length > 0 ? `Removed, a breaking change (see docs/public-api.md):\n${list(removed)}` : '',
      added.length > 0 ? `Added:\n${list(added)}` : '',
    ].filter(Boolean).join('\n'),
  );
});
