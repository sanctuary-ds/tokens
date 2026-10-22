# Architecture

Sanctuary is a token pipeline: a small dependency-free engine in `src/` generates DTCG token files, a stylesheet and application themes. Everything a consumer uses is generated; everything a maintainer edits is in `src/`.

## Pipeline

```text
src/palette.js    ─┐
src/foundation.js ├─► src/tokens.js ─► tokens/*.tokens.json   (DTCG 2025.10, interchange)
src/color.js      ─┘        │         ─► tokens/sanctuary.resolver.json
                            ├─► src/emit/css.js   ─► dist/css/sanctuary.css
                            ├─► src/emit/ports.js ─► ports/<app>/sanctuary-<flavor>.*
                            └─► scripts/build.js  ─► dist/palette.json
```

`pnpm run build` writes all of it. `pnpm run check` (also run by the test suite) fails when a generated file is stale.

## Token tiers

| Tier | Example token | Custom property | Depends on |
|------|---------------|-----------------|------------|
| 1. Pigment (primitive) | `pigment.cobalt.300` | `--san-pigment-cobalt-300` | Nothing |
| 2. Flavor roles | `surface.raised-2`, `glass.cobalt.pane` | `--san-surface-raised-2`, `--san-glass-cobalt-pane` | Flavor |
| 3. Semantic aliases | `accent.$root`, `danger.pane`, `syntax.keyword` | `--san-accent`, `--san-danger-pane` | Flavor, accent |
| 4. Light (CSS only) | glaze, cast, halo, window | `--san-glaze-bg`, `--san-cast-md`, `--san-window` | Flavor, accent, glazing, window setting |

Components must read tiers 3 and 4 (and tier 2 for stone, ink and lead). Reading a pigment directly bypasses the flavor and breaks contrast guarantees.

Foundations (space, radius, type, motion, elevation geometry, layers) are flavor-independent and live beside tier 1.

## Color generation

Colors are computed in OKLCH and gamut-mapped to sRGB.

1. Each tone has a fixed lightness, shared by every pigment.
2. Chroma follows a bell curve over the ramp, scaled by the pigment's peak chroma.
3. Chroma is capped at 94% of the sRGB gamut boundary for that lightness and hue, so no color is clipped and none sits on the edge of the gamut.
4. Yellow pigments rotate their hue toward orange in the dark tones (`drift`), so they deepen to amber instead of olive.

Tokens store the OKLCH triple and a hex fallback, as the DTCG color module specifies. CSS uses `oklch()`; ports use hex.

## How switching works in CSS

```css
:root, [data-san-flavor="compline"] { /* stone, glass roles, default accent, elevation */ }
[data-san-flavor="lauds"]           { /* same properties, other values */ }
[data-san-accent="ruby"]            { --san-accent: var(--san-glass-ruby); /* ... */ }
:root, [data-san-*]                 { /* cast, halo, state layers, default glaze and window */ }
[data-san-glazing="flashed"]        { /* glaze overrides */ }
[data-san-window="harmonic"]        { /* window stops: the accent and its neighbors */ }
```

Two rules of the cascade shape this file:

- **Order.** `:root` and an attribute selector have the same specificity. The default flavor is therefore emitted first, or a flavor attribute on `<html>` would lose to it.
- **Re-resolution.** `var()` is substituted on the element where a property is *declared*. A value that depends on another axis must be redeclared on every nested theming element, so each accent, glazing and window rule also matches descendants that carry a different theming attribute:

  ```css
  [data-san-accent="ruby"],
  [data-san-accent="ruby"] :is([data-san-flavor], [data-san-accent], [data-san-glazing], [data-san-window]):not([data-san-accent]) { ... }
  ```

Known limit: when the *same* axis is nested twice with a different axis in between (accent inside flavor inside accent), source order decides instead of the nearest ancestor. Set the attribute again on the inner element to be explicit.

## Decisions

| Decision | Choice | Reason | Trade-off |
|----------|--------|--------|-----------|
| Token format | DTCG 2025.10 (Format, Color, Resolver) | First stable revision; a vendor-neutral contract for Figma, Style Dictionary, Terrazzo and others | The spec has no string type and no color functions, so tier 4 cannot be expressed in it |
| Source of truth | Code in `src/`, DTCG is generated | The palette is parametric: 132 pigment tones and 4 flavors derive from a few numbers | Designers cannot edit token JSON directly; they change parameters |
| Build tooling | Own zero-dependency emitters | Nothing to install; support for the 2025.10 revision in third-party tools could not be confirmed at the time | The emitters must be maintained; adopting Style Dictionary or Terrazzo later is possible because the DTCG files already exist |
| Color space | OKLCH, sRGB gamut | Perceptually even ramps and predictable contrast; sRGB keeps ports exact | Wide-gamut (P3) pigments are not used yet |
| Accent model | Tonal ramps plus per-flavor role mapping | Guarantees contrast for any accent in any flavor | Less hand-tuned per flavor than a curated palette |
| Glazing | A separate axis, CSS only | Keeps the accent a pure color choice; needs `color-mix()` | Not portable through DTCG; ports receive solid colors |
| Window | A setting derived from the accent (`mono`, `harmonic`), not an axis | A window independent of the accent made cast light compete with the controls; ports ignore it anyway | A whole theme cannot be recolored against its accent with one attribute; the five named windows remain as fixed gradients to place by hand |
| Generated files | Committed | Ports are consumed straight from the repository, and consumers can pin a commit without a build step | Diffs include generated output; `npm run check` guards drift |
| Prefix | `san` (`--san-*`, `data-san-*`, future `<san-button>`) | Short and unlikely to collide | None known |

## Browser support

The stylesheet relies on `oklch()`, `color-mix()` and `:is()`, all widely available since 2023.

## Testing

`pnpm test` covers the contracts that are easy to break silently:

| Test | Guards |
|------|--------|
| OKLCH conversion against the DTCG color module example | The color maths |
| Ramps are in gamut and strictly darkening | Palette generation |
| Text, accent, `on` and `on-pane` pairs reach 4.5:1 in every flavor | Accessibility |
| Every token has a type, a legal name and a resolvable alias | DTCG validity |
| Every `var(--san-*)` that is read is declared | Stylesheet integrity |
| The default flavor block precedes the others | Flavor switching on the root element |
| One theme per flavor per port, sixteen ANSI colors | Ports |
| The package matches the committed API report | The [public API](public-api.md) |
| Generated files match the sources | Drift |
