# Sanctuary

A design system of stone, glass, lead and light: the chiaroscuro of a Gothic nave and the color its windows throw on the floor. It ships as design tokens first, so the same palette can theme a web component library, a terminal and a window manager.

## Quick path

1. Try every axis live in the [playground](https://sanctuary-ds.github.io/playground/) and share a look as a link, for example [Lauds with ruby, flashed glass and a harmonic window](https://sanctuary-ds.github.io/playground/?flavor=lauds&accent=ruby&glazing=flashed&window=harmonic).
2. Use the stylesheet in your own page with the attributes below.
3. To change the system, edit `src/`, then run `pnpm run build` and `pnpm test`.

## Install

```sh
pnpm add @sanctuary-ds/tokens
```

With a bundler (Vite, Astro, webpack), import the stylesheet once:

```js
import '@sanctuary-ds/tokens/css';
```

Without a build step, link it from a CDN that serves npm packages:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@sanctuary-ds/tokens@0.3/dist/css/sanctuary.css">
```

The resolved colors are also available as data, and the DTCG files under `tokens/` for design tools and token pipelines:

```ts
import { flavors, pigments } from '@sanctuary-ds/tokens/palette';
import type { FlavorId, PigmentId } from '@sanctuary-ds/tokens/palette';
```

Bundlers keep only what you import. Tools outside JavaScript can read the same data from `@sanctuary-ds/tokens/palette.json`.

## The three axes

| Axis | Values | What it changes |
|------|--------|-----------------|
| Flavor | `lauds` (dawn, light), `vespers` (dusk), `compline` (night, default), `matins` (deep night) | Stone, ink, lead and shadow. Every pigment is re-toned to stay legible. |
| Accent | `ruby` `ember` `amber` `gilt` `verdure` `viridian` `azure` `cobalt` `indigo` `amethyst` `murrey` `rose` | Which pigment does the precise work: actions, focus, selection. |
| Glazing | `pot-metal` (solid), `flashed` (translucent, glowing), `grisaille` (line only) | How the accent is rendered on a filled element. |

```html
<html data-san-flavor="vespers" data-san-accent="amber" data-san-glazing="flashed">
```

One secondary setting, `data-san-window`, shapes the light that is cast (gradients, glows, heroes). It always follows the accent: `mono` (default) uses that pigment alone, `harmonic` leads it with its two neighbors on the hue wheel.

Any element can carry these attributes, so a card can sit in another flavor or accent than its page.

## What is in the repository

| Path | Contents | Edited by hand |
|------|----------|----------------|
| `src/` | The source of truth: color maths, palette, foundations, emitters | Yes |
| `tokens/` | DTCG 2025.10 token files and a resolver document | No, generated |
| `dist/` | `css/sanctuary.css` (custom properties), and the palette as `palette.js`, `palette.d.ts` and `palette.json` | No, generated |
| `docs/` | Design language, architecture, token reference, ecosystem plan | Yes |

The npm package, `@sanctuary-ds/tokens`, contains only `dist/` and `tokens/`, with this README and the license; a test keeps it that way.

## Commands

| Command | Result |
|---------|--------|
| `pnpm run build` | Regenerates `tokens/` and `dist/` |
| `pnpm run check` | Fails if any generated file is stale |
| `pnpm run typecheck` | Checks the types of `src/`, `scripts/` and `test/` |
| `pnpm test` | Color maths, WCAG AA contrast for every flavor, DTCG validity, cascade order, public API |

The package has no dependencies: it is CSS and data, with no logic to run. The tools are written in TypeScript, which Node runs directly by stripping the types, so there is no compile step; TypeScript itself is a development dependency that only checks them. They run on Node 24 or later, which pnpm downloads for the project when it is missing (`devEngines.runtime` in `package.json`).

## Releasing

Releases are prepared by [release-please](https://github.com/googleapis/release-please) and published to npm by `.github/workflows/release.yml` with npm trusted publishing, so no npm token is stored anywhere. The version and the changelog come from the conventional commits on `main`. To release:

1. Merge the pull request titled `chore(main): release X.Y.Z`, which release-please keeps up to date. Read its version and its `CHANGELOG.md` entries before merging: a published version cannot be replaced.
2. Merging it creates the tag `vX.Y.Z` and the GitHub release.
3. Approve the `npm` deployment in the `Release` workflow run.

Only `feat`, `fix`, `perf` and `revert` commits, and breaking changes, open a release pull request. `docs`, `test`, `refactor`, `build`, `ci`, `chore` and `style` commits do not: they change nothing consumers use, so they never publish a version on their own. A README change reaches the npm page with the next release.

Pull requests are merged with a merge commit, so every commit reaches `main` with its own signature. GitHub copies the pull request title into the merge commit, and release-please would read a conventional title as a second change. Title a pull request with a plain sentence, such as `Declare the DTCG 2025.10 version in the resolver`, and keep the conventional messages on its commits. The `Pull request title` workflow checks this.

Before 1.0.0, a breaking change raises the minor version and any other change raises the patch version, as [the public API](docs/public-api.md#how-changes-are-versioned) describes.

The release workflow runs the tests, checks that the tagged commit is on `main` and that the tag matches the version, waits for the approval, and publishes with provenance. Release-please runs as a GitHub App (its client ID in the repository variable `RELEASE_APP_CLIENT_ID`, its private key in the repository secret `RELEASE_APP_PRIVATE_KEY`), so the tags and pull requests it creates start the other workflows.

A published version can never be replaced on npm. If one is wrong, release a fixed patch version and mark the bad one with `npm deprecate @sanctuary-ds/tokens@<version> "<reason>"`.

## Read next

- [Design language](https://sanctuary-ds.github.io/docs/philosophy): the idea, the materials and the rules, on the site.
- [Architecture](docs/architecture.md): token tiers, the build pipeline and the decisions behind them.
- [Token reference](https://sanctuary-ds.github.io/docs/tokens): every token and custom property, generated from the package, on the site.
- [Using the tokens](docs/tokens.md): the quick path, the tokens that are not custom properties, the DTCG files, the plain palette and the fonts.
- [Public API](docs/public-api.md): what stays stable and how each change is versioned.
- [Roadmap](ROADMAP.md): the phases of the core, up to `1.0.0`.
- [Ecosystem](docs/ecosystem.md): the planned GitHub organization, the Lit library and the [ports](https://github.com/sanctuary-ds/ports) for desktop applications.

## Status

Before `1.0.0`: a breaking change bumps the minor version, as [Public API](docs/public-api.md#how-changes-are-versioned) explains. The current version and what changed in each one are in the [releases](https://github.com/sanctuary-ds/tokens/releases); the [roadmap](ROADMAP.md) lists what comes next, up to `1.0.0`.

## License

[MIT](LICENSE). Sanctuary names its fonts but does not ship them; each font keeps its own license.
