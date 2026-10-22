# Public API

What `@sanctuary-ds/tokens` promises to keep stable, and how each kind of change moves the version number.

## What is public

Five parts of the published package are public. Each one appears in the [API report](../api/sanctuary.api.txt) with its own prefix.

| Part | Example | Report prefix |
|------|---------|---------------|
| Entry points in `exports` | `@sanctuary-ds/tokens/css` | `export` |
| Custom properties the stylesheet declares | `--san-accent-ink` | `css` |
| Theme attributes and their values | `data-san-flavor="vespers"` | `attribute` |
| Keys of `palette.json`, and the ids of its flavors, pigments, windows, window modes, glazings and fonts | `flavors.<flavor>.colors.surface.hex` | `palette` |
| DTCG files and the token paths in them | `semantic.tokens.json` `danger.ink` | `file`, `token` |

Not public: the values (hex codes, OKLCH components, durations, font stacks), descriptions and notes, the order of rules in the stylesheet, and everything outside the package, such as `src/`, `scripts/` and `ports/`.

## How changes are versioned

The version follows [Semantic Versioning](https://semver.org/).

| Change | Level | Examples |
|--------|-------|----------|
| Remove or rename anything public | Major | Rename `--san-glass-ruby-lume`; drop a pigment; move an entry point |
| Add something public | Minor | A new token, pigment, flavor or `palette.json` key |
| Change a value while every guarantee holds | Minor | Retune a tone; contrast still reaches 4.5:1 |
| Change a value in a way that breaks a guarantee | Major | A text pair falls below 4.5:1 |
| Fix text that is not part of the API | Patch | Spelling in a description |

Until `1.0.0`, every level moves one place to the right: a breaking change bumps the minor version (`0.1.x` to `0.2.0`), and anything else bumps the patch. A range such as `^0.1.1`, or the CDN path `@0.1`, therefore never pulls a breaking change.

## Deprecating before removing

A public name is not removed in the release that replaces it:

1. **Deprecate** in a minor release. The DTCG token gets `$deprecated` with a short note naming its replacement, and the old custom property stays, set to the new one (`--san-old: var(--san-new)`), so nothing breaks.
2. **Remove** in the next major release.

## The API report

[`api/sanctuary.api.txt`](../api/sanctuary.api.txt) lists every public name, one per line, sorted. It holds names only, so a new color value leaves it unchanged. A path that every flavor, accent, pigment, window, window mode, glazing or font has is written once with a placeholder, such as `flavors.<flavor>.accent`; a path that only some of them have is written for each one, such as `pigments.amber.drift`. A test compares it with the package and fails on any difference, added or removed, so every change to the API appears in the report's diff and is reviewed with the change that caused it.

After changing `src/`:

```sh
pnpm run build   # regenerate the package files
pnpm run api     # regenerate the report from them
```

In the report's diff, an added line is a minor change. A removed line is a breaking change, which needs a major release (a minor one before `1.0.0`), with one exception: when a new id lacks a path the others have, the placeholder line is replaced by one line per existing id. Nothing was taken away from those ids, so the change is minor. The test's message names both kinds of line, removed and added, so the two cases are easy to tell apart.
