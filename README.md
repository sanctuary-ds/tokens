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
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@sanctuary-ds/tokens@0.1/dist/css/sanctuary.css">
```

The resolved colors are also available as data, and the DTCG files under `tokens/` for design tools and token pipelines:

```js
import palette from '@sanctuary-ds/tokens/palette' with { type: 'json' };
```

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
| `dist/` | `css/sanctuary.css` (custom properties) and `palette.json` | No, generated |
| `ports/` | Themes for kitty, Ghostty, Alacritty, base16, GTK CSS (Waybar) and Hyprland | No, generated |
| `docs/` | Design language, architecture, token reference, ecosystem plan | Yes |

The npm package, `@sanctuary-ds/tokens`, contains only `dist/` and `tokens/`, with this README and the license; a test keeps it that way.

## Commands

| Command | Result |
|---------|--------|
| `pnpm run build` | Regenerates `tokens/`, `dist/` and `ports/` |
| `pnpm run check` | Fails if any generated file is stale |
| `pnpm test` | Color maths, WCAG AA contrast for every flavor, DTCG validity, cascade order, ports |

There are no dependencies. The tools run on Node 22 or later; development uses Node 24, which pnpm downloads for the project when it is missing (`devEngines.runtime` in `package.json`).

## Releasing

Releases are published to npm by `.github/workflows/release.yml` with npm trusted publishing, so no npm token is stored anywhere. To release:

1. Raise `version` in `package.json` in a pull request and merge it.
2. Tag the merge commit with the same version, for example `git tag -s v0.1.1 && git push origin v0.1.1`.
3. Approve the `npm` deployment in the workflow run.

The workflow runs the tests, checks that the tagged commit is on `main` and that the tag matches the version, waits for the approval, and publishes with provenance.

A published version can never be replaced on npm. If one is wrong, release a fixed patch version and mark the bad one with `npm deprecate @sanctuary-ds/tokens@<version> "<reason>"`.

## Read next

- [Design language](https://sanctuary-ds.github.io/docs/philosophy): the idea, the materials and the rules, on the site.
- [Architecture](docs/architecture.md): token tiers, the build pipeline and the decisions behind them.
- [Token reference](docs/tokens.md): every group and its custom properties.
- [Ecosystem](docs/ecosystem.md): the planned GitHub organization, the Lit library and ports.

## Status

`0.1.0`, the foundation.

## License

[MIT](LICENSE). Sanctuary names its fonts but does not ship them; each font keeps its own license.
