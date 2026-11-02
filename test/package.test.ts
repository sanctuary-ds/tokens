import { after, before, describe, it, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('..', import.meta.url));
const name = '@sanctuary-ds/tokens';
// pnpm sets npm_execpath for the scripts it runs. Without it this suite cannot pack, so it skips: on a
// bare `node --test`, and in the CI job `minimum-node`, which has no pnpm and declares so with
// SANCTUARY_NO_PNPM. The jobs that run `pnpm test`, in CI and in the release workflow, run the suite.
const pnpm = process.env.npm_execpath;
const canPack = Boolean(pnpm && /pnpm/.test(pnpm));
const skip = canPack ? false : 'run through pnpm to check the packed package';

test('CI runs the packed package suite, unless a job declares that it has no pnpm', () => {
  const required = Boolean(process.env.CI) && !process.env.SANCTUARY_NO_PNPM;
  assert.ok(canPack || !required, 'This CI job would skip the packed package suite: run `pnpm test`, or set SANCTUARY_NO_PNPM if the job has no pnpm.');
});

const SETUPS = {
  nodenext: { module: 'nodenext', moduleResolution: 'nodenext' },
  bundler: { module: 'esnext', moduleResolution: 'bundler' },
};

describe('the packed package, used as a consumer uses it', { skip }, () => {
  let consumer = '';

  before(() => {
    consumer = mkdtempSync(join(tmpdir(), 'sanctuary-consumer-'));
    const [command, args] = /\.c?js$/.test(pnpm!) ? [process.execPath, [pnpm!]] : [pnpm!, []];
    execFileSync(command, [...args, 'pack', '--pack-destination', consumer], { cwd: repo, stdio: 'pipe' });
    const tarball = readdirSync(consumer).find((file) => file.endsWith('.tgz'))!;
    const target = join(consumer, 'node_modules', name);
    mkdirSync(target, { recursive: true });
    execFileSync('tar', ['-xzf', join(consumer, tarball), '-C', target, '--strip-components=1']);
    writeFileSync(join(consumer, 'package.json'), JSON.stringify({ type: 'module' }));
  });

  after(() => rmSync(consumer, { recursive: true, force: true }));

  /** Type-checks a source file in the consumer, under one module setup. */
  function typecheck(source: string, setup: keyof typeof SETUPS) {
    writeFileSync(join(consumer, 'probe.ts'), source);
    const compilerOptions = { ...SETUPS[setup], target: 'esnext', noEmit: true, strict: true, skipLibCheck: false, types: [], resolveJsonModule: true };
    writeFileSync(join(consumer, 'tsconfig.json'), JSON.stringify({ compilerOptions, files: ['probe.ts'] }));
    return spawnSync(join(repo, 'node_modules/.bin/tsc'), ['-p', '.'], { cwd: consumer, encoding: 'utf8' });
  }

  /** Runs a module in the consumer with Node. */
  function run(source: string) {
    writeFileSync(join(consumer, 'probe.mjs'), source);
    return spawnSync(process.execPath, ['probe.mjs'], { cwd: consumer, encoding: 'utf8' });
  }

  for (const setup of ['nodenext', 'bundler'] as const) {
    it(`accepts the real data, with every key declared and every required key present (${setup})`, () => {
      // A literal is checked for excess properties too, so an undeclared key fails here. The check
      // runs from data to types, so a type wider than the data, such as an unused union member, passes.
      const data = readFileSync(join(consumer, 'node_modules', name, 'dist/palette.json'), 'utf8');
      const result = typecheck(`import type * as Palette from '${name}/palette';\nconst palette: typeof Palette = ${data};\nconsole.log(palette);\n`, setup);
      assert.equal(result.status, 0, result.stdout);
    });

    it(`rejects an id that does not exist (${setup})`, () => {
      const result = typecheck(`import type { FlavorId } from '${name}/palette';\nconst id: FlavorId = 'nope';\nconsole.log(id);\n`, setup);
      assert.notEqual(result.status, 0);
      assert.match(result.stdout, /TS2322/);
    });

    it(`rejects a default import, which the module does not have (${setup})`, () => {
      const result = typecheck(`import palette from '${name}/palette';\nconsole.log(palette);\n`, setup);
      assert.notEqual(result.status, 0);
      assert.match(result.stdout, /TS1192/);
    });

    it(`types the flavors, down to one color (${setup})`, () => {
      const result = typecheck(`import { flavors } from '${name}/palette';\nconst hex: string = flavors.lauds.colors.surface.hex;\nconsole.log(hex);\n`, setup);
      assert.equal(result.status, 0, result.stdout);
    });

    it(`keeps palette.json importable as JSON (${setup})`, () => {
      const result = typecheck(`import palette from '${name}/palette.json' with { type: 'json' };\nconsole.log(palette.defaultFlavor);\n`, setup);
      assert.equal(result.status, 0, result.stdout);
    });
  }

  it('runs a named import in Node, with no import attribute', () => {
    const result = run(`import { defaultFlavor, flavors } from '${name}/palette';\nconsole.log(flavors[defaultFlavor].name);\n`);
    assert.equal(result.status, 0, result.stderr);
    assert.notEqual(result.stdout.trim(), '');
  });

  it('fails a default import in Node, as its types say', () => {
    const result = run(`import palette from '${name}/palette';\nconsole.log(palette);\n`);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /does not provide an export named 'default'/);
  });

  it('serves the same data as a module and as JSON', () => {
    const result = run([
      "import assert from 'node:assert/strict';",
      `import * as module from '${name}/palette';`,
      `import data from '${name}/palette.json' with { type: 'json' };`,
      'assert.deepEqual({ ...module }, data);',
    ].join('\n'));
    assert.equal(result.status, 0, result.stderr);
  });

  it('resolves every entry point to a file in the package', () => {
    const entries = ['css', 'palette', 'palette.json', 'tokens/semantic.tokens.json', 'package.json'];
    const result = run(`for (const entry of ${JSON.stringify(entries)}) console.log(import.meta.resolve('${name}/' + entry));\n`);
    assert.equal(result.status, 0, result.stderr);
    const files = result.stdout.trim().split('\n').map((url) => fileURLToPath(url));
    assert.equal(files.length, entries.length);
    for (const file of files) assert.ok(existsSync(file), file);
  });

  it('tells bundlers that only the stylesheet has side effects', () => {
    const manifest = JSON.parse(readFileSync(join(consumer, 'node_modules', name, 'package.json'), 'utf8'));
    assert.deepEqual(manifest.sideEffects, ['**/*.css']);
  });
});
