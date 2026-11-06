# Roadmap

The core of Sanctuary, published as [`@sanctuary-ds/tokens`](https://www.npmjs.com/package/@sanctuary-ds/tokens): the token engine, the DTCG tokens, the stylesheet and the palette. Every other repository of the [`sanctuary-ds`](https://github.com/sanctuary-ds) organization depends on it.

This document is the brief for whoever changes the core. Read it before changing anything, and change it when a decision below is taken. Decisions that cross repositories are recorded in [`docs/ecosystem.md`](docs/ecosystem.md).

## Scope

| In this repository | Elsewhere |
|--------------------|-----------|
| Color maths, palette, foundations and the emitters in `src/` | The site, the playground and the design language: [`sanctuary-ds.github.io`](https://github.com/sanctuary-ds/sanctuary-ds.github.io) |
| DTCG token files, `sanctuary.css`, and the palette as a typed module and as `palette.json` | Components: `web-components`, planned |
| Their technical docs: architecture, token reference, public API | Application themes: [`ports`](https://github.com/sanctuary-ds/ports) |

## Principles

- **A small, stable package.** The core ships tokens, a stylesheet and a palette. Anything that consumes them lives in the repository that consumes them.
- **Every release changes the package.** A version is published only when `dist/` or `tokens/` change. Cleanups of the repository, its docs or its tests are not released.
- **The contract is written down.** [`docs/public-api.md`](docs/public-api.md) defines what is public, and a test keeps the [API report](api/sanctuary.api.txt) in step with the package.
- **No runtime dependencies.** The package is CSS and data, with no logic to run; the engine runs on Node alone.

## Contract with the other repositories

- Consumers depend on `@sanctuary-ds/tokens` from npm, pinned to an exact version, and update it in a commit of its own.
- Renaming or removing a public name is a breaking change, preceded by a deprecation (see [Deprecating before removing](docs/public-api.md#deprecating-before-removing)).
- A token a consumer needs is added here, never patched in the consumer.

## Phases

Each phase ends in a release to npm or in an internal change, and says which.

### Phase 1: A clean core (internal)

- [x] Publish `0.1.0`, then `0.1.1`, through CI with trusted publishing and provenance.
- [x] Move the showcase to the site's playground.
- [x] Move the design language to the site, keeping a page of links.
- [x] Move the ports out, to the `ports` repository.
- [x] Guard the public API with a committed report.

### Phase 2: TypeScript source (internal)

- [x] Convert `src/`, `scripts/` and `test/` to TypeScript run directly by Node (type stripping, erasable syntax only), with Node 24 as the minimum.
- [x] Check the types with `pnpm run typecheck` in CI and before each release.

No release: the source is not published, so the package did not change.

### Phase 3: A typed palette (release `0.2.0`)

- [x] Publish the palette as a typed module, generated from the source, so `ports` and `web-components` can rely on ids such as `FlavorId` and `PigmentId`. A breaking change: `./palette` becomes the module and the JSON moves to `./palette.json`.
- [x] Verify how a JSON entry point carries its types before choosing the shape. Types over a JSON file left the import attribute unchecked and could not be tree-shaken, so the entry point became a module.
- [x] Add the types to the public API report.
- [ ] Update the site to the new entry point and its guide for writing a port, after the release.
- [x] Type the token trees from their source, so the build and the tests no longer cast the typography tree.
- [x] Derive the `Role` type from the list of glass roles, so a new role cannot be left out of the tokens.
- [x] Pass the test file pattern to `node --test` explicitly, so a run without type stripping fails instead of finding no tests.

### Phase 4: Wide gamut

- [ ] Decide whether pigments gain Display P3 values next to the sRGB ones; see [Open decisions](#open-decisions).
- [ ] If they do, add them as an addition that keeps every existing name and value.

### Phase 5: Road to `1.0.0`

`1.0.0` means the contract is stable, not that the system is complete. It is published when:

- [ ] `web-components` and `ports` consume the package in their own releases.
- [ ] Several releases have passed without a breaking change.
- [x] Releases are automated (release-please with a GitHub App, so its pull requests and tags run the workflows).

## Open decisions

| Decision | Options | When |
|----------|---------|------|
| Wide gamut | Display P3 pigments, or sRGB only | Phase 4 |

## Working agreement

- Commits are signed and follow Conventional Commits (`type(scope): subject`), with no emoji.
- Work happens on a branch per phase and merges through a pull request. A feature pull request never raises the version; a release pull request does.
- Releasing follows the [README](README.md#releasing).
