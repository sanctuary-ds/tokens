import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const text = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

// Release-please rewrites the version between these markers in its release pull request, which also
// bumps package.json. If a marker is edited away, the updater skips the link without a warning, and
// the link falls behind the release; this test fails instead.
test("the README's stylesheet link names the package version, inside release-please's markers", () => {
  const { version } = JSON.parse(text('package.json'));
  const block = text('README.md').match(/x-release-please-start-version -->\n([\s\S]*?)<!-- x-release-please-end/);
  assert.ok(block, 'README.md has no x-release-please-start-version block');
  const versions = [...block[1].matchAll(/@sanctuary-ds\/tokens@([^/]+)\//g)].map(([, linked]) => linked);
  assert.deepEqual(versions, [version], 'the block holds one stylesheet link, at the version in package.json');

  const config = JSON.parse(text('release-please-config.json'));
  assert.deepEqual(config.packages['.']['extra-files'], [{ type: 'generic', path: 'README.md' }]);
});
