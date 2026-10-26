# Roadmap

The core of Sanctuary, published as [`@sanctuary-ds/tokens`](https://www.npmjs.com/package/@sanctuary-ds/tokens): the token engine, the DTCG tokens, the stylesheet and the palette. Every other repository of the [`sanctuary-ds`](https://github.com/sanctuary-ds) organization depends on it.

This document is the brief for whoever changes the core. Read it before changing anything, and change it when a decision below is taken. Decisions that cross repositories are recorded in [`docs/ecosystem.md`](docs/ecosystem.md).

## Scope

| In this repository | Elsewhere |
|--------------------|-----------|
| Color maths, palette, foundations and the emitters in `src/` | The site, the playground and the design language: [`sanctuary-ds.github.io`](https://github.com/sanctuary-ds/sanctuary-ds.github.io) |
| DTCG token files, `sanctuary.css` and `palette.json` | Components: `web-components`, planned |
| Their technical docs: architecture, token reference, public API | Application themes: [`ports`](https://github.com/sanctuary-ds/ports) |

## Principles

- **A small, stable package.** The core ships tokens, a stylesheet and a palette. Anything that consumes them lives in the repository that consumes them.
- **Every release changes the package.** A version is published only when `dist/` or `tokens/` change. Cleanups of the repository, its docs or its tests are not released.
- **The contract is written down.** [`docs/public-api.md`](docs/public-api.md) defines what is public, and a test keeps the [API report](api/sanctuary.api.txt) in step with the package.
- **No runtime dependencies.** The package is CSS and JSON; the engine runs on Node alone.

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

- [ ] Convert `src/` and `scripts/` to TypeScript run directly by Node (type stripping, erasable syntax only).
- [ ] Check the types with `tsc --noEmit` in the test suite and in CI.

No release: the package publishes CSS and JSON, not JavaScript.

### Phase 3: A typed palette (release `0.1.2`)

- [ ] Publish types for `palette.json`, generated from the source, so `ports` and `web-components` can rely on ids such as `FlavorId` and `PigmentId`.
- [ ] Verify how a JSON entry point carries its types (the `types` condition in `exports`, or a separate entry point) before choosing the shape.
- [ ] Add the types to the public API report.

### Phase 4: Wide gamut

- [ ] Decide whether pigments gain Display P3 values next to the sRGB ones; see [Open decisions](#open-decisions).
- [ ] If they do, add them as an addition that keeps every existing name and value.

### Phase 5: Road to `1.0.0`

`1.0.0` means the contract is stable, not that the system is complete. It is published when:

- [ ] `web-components` and `ports` consume the package in their own releases.
- [ ] Several releases have passed without a breaking change.
- [ ] Releases are automated (release-please with a GitHub App, so its pull requests and tags run the workflows).

## Open decisions

| Decision | Options | When |
|----------|---------|------|
| Wide gamut | Display P3 pigments, or sRGB only | Phase 4 |
| Shape of the palette types | `types` condition on `./palette`, or a separate entry point | Phase 3 |

## Working agreement

- Commits are signed and follow Conventional Commits (`type(scope): subject`), with no emoji.
- Work happens on a branch per phase and merges through a pull request. A feature pull request never raises the version; a release pull request does.
- Releasing follows the [README](README.md#releasing).
