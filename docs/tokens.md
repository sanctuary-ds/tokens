# Using the tokens

Almost every token is a custom property prefixed `--san-`; [pigments](#pigments) and [breakpoints](#breakpoints) are the exceptions. The name is the DTCG token path joined with hyphens; a group's `$root` token takes the group's own name (`accent.$root` is `--san-accent`).

## Quick path

```css
@import "@sanctuary-ds/tokens/css"; /* resolved by a bundler; or link dist/css/sanctuary.css directly */

.button {
  background: var(--san-glaze-sheen), var(--san-glaze-bg);
  color: var(--san-glaze-fg);
  border: var(--san-border-width-hairline) solid var(--san-glaze-border);
  border-radius: var(--san-radius-sm);
  box-shadow: var(--san-glaze-glow), var(--san-elevation-1);
  backdrop-filter: var(--san-glaze-blur);
  font: var(--san-type-label-lg);
  letter-spacing: var(--san-type-label-lg-tracking);
}
.button:focus-visible { box-shadow: var(--san-halo); }
```

## The groups

The [token reference](https://sanctuary-ds.github.io/docs/tokens) on the site lists every token and custom property, with its value in each flavor. It is generated from this package, so it always matches the version the site documents. It is organized by group: [stone, ink and lead](https://sanctuary-ds.github.io/docs/tokens#stone), [glass](https://sanctuary-ds.github.io/docs/tokens#glass), [accent](https://sanctuary-ds.github.io/docs/tokens#accent), [status](https://sanctuary-ds.github.io/docs/tokens#status), [syntax](https://sanctuary-ds.github.io/docs/tokens#syntax), [terminal](https://sanctuary-ds.github.io/docs/tokens#terminal), [named windows](https://sanctuary-ds.github.io/docs/tokens#windows), [pigments](https://sanctuary-ds.github.io/docs/tokens#pigments) and the foundations, from [space](https://sanctuary-ds.github.io/docs/tokens#space) to [effect](https://sanctuary-ds.github.io/docs/tokens#effect). What each glass role is for, and which pairs are safe for text, is explained in [Color](https://sanctuary-ds.github.io/docs/foundations/color) and [Accessibility](https://sanctuary-ds.github.io/docs/accessibility).

The notes below cover what the reference does not: how to read the tokens that are not custom properties, and what the stylesheet does for you.

### Pigments

The raw ramps are not custom properties you can rely on: the stylesheet declares them as private `--_san-pigment-<p>-<tone>` to build the glass, and they can change in any release. Use a glass role (`--san-glass-<p>`, `-lume`, `-ink`, `-pane`, `-on`, `-on-pane`) in an interface. For illustration and data, read the ramps from `@sanctuary-ds/tokens/palette` (`pigments.<p>.tones`) or `tokens/pigment.tokens.json`.

### Accent and status

Each flavor's default accent is kept off the four status pigments (danger is ruby, warning amber, success verdure, info azure), so a primary action never matches a status out of the box. An accent you set yourself can be a status pigment: `data-san-accent="ruby"` makes `--san-accent` the same color as `--san-danger`. Color alone never carries the meaning of a status; pair it with a label or an icon, as [Accessibility](https://sanctuary-ds.github.io/docs/accessibility) describes.

### Light

Glazing, cast, halo, state layers and the window that follows the accent (`--san-window`, with its stops `-a` to `-c`) are computed by the stylesheet from the active flavor, accent, glazing and window setting, so they exist only as custom properties, not in the token files. The named windows and elevation are in both. A state layer (`--san-state-layer-<state>`) is `currentColor` at `--san-opacity-<state>`, so it follows the content color and the opacity token.

### Breakpoints

Breakpoints are not custom properties: a media query cannot read one. Read them from `breakpoint` in `tokens/foundation/layout.tokens.json` and write the values into your queries, or let a preprocessor do it.

### Reduced motion

When the visitor asks for reduced motion (`prefers-reduced-motion: reduce`), the stylesheet sets every `--san-duration-*` token to `0ms`, so anything timed with the tokens changes instantly. A zero-length transition does not start, so it fires no `transitionend` event; code that waits for one should check the duration first. Animations or durations written without the tokens are not covered.

## Using the DTCG files

`tokens/sanctuary.resolver.json` declares the sets and two modifiers a DTCG resolver needs:

| Modifier | Contexts | Default |
|----------|----------|---------|
| `flavor` | `lauds`, `vespers`, `compline`, `matins` | `compline` |
| `accent` | `flavor` (keep the flavor's default) or any pigment | `flavor` |

Glazing, cast, halo, state layers and the arch shapes are not in the token files: the format has no color functions or string type. They are defined in `src/emit/css.ts`.

## Using the plain palette

The palette holds resolved values for tools that do not want a token pipeline. It comes in two forms, with the same data:

| Entry point | For | How to read it |
|-------------|-----|----------------|
| `@sanctuary-ds/tokens/palette` | JavaScript and TypeScript, with types such as `FlavorId` and `PigmentId` | `import { flavors } from '@sanctuary-ds/tokens/palette';` |
| `@sanctuary-ds/tokens/palette.json` | Tools in any other language | Read `dist/palette.json` from the package |

Each top-level key below is a named export of the module:

```json
{ "flavors": { "compline": { "scheme": "dark", "accent": "cobalt",
    "colors": { "surface": { "hex": "#0d111b", "oklch": [0.18, 0.022, 265] } } } },
  "pigments": { "cobalt": { "hue": 259, "tones": { "300": "#9bc1fb" } } } }
```

It also lists the named windows (`windows`), the values of `data-san-window` (`windowModes`) and the glazings (`glazings`), each with a display name and a note, so a tool can offer the same choices as the stylesheet. `defaultFlavor`, `defaultGlazing` and `defaultWindow` name what the stylesheet shows before anyone chooses.

`fonts` lists each font family with its fallbacks, its generic family, and the weights the type scale uses, so a site loads exactly those. `styles` is `["normal"]` for every family today, because no type role sets an italic:

```json
"fonts": { "text": { "family": "Hanken Grotesk", "fallbacks": ["Inter", "system-ui"],
    "generic": "sans-serif", "weights": [400, 500, 600], "styles": ["normal"] } }
```

## Fonts

Sanctuary names its fonts but does not load them. Each key of `fonts` in `palette.json` is a font role, and the stylesheet exposes the same role as a custom property:

| Role | Custom property | Used by |
|------|-----------------|---------|
| `display` | `--san-font-family-display` | Display and headline type |
| `text` | `--san-font-family-text` | Titles, body and labels |
| `mono` | `--san-font-family-mono` | Code |
| `inscription` | `--san-font-family-inscription` | Carved overlines |

The match between a `fonts` key and its custom property is part of the contract, and a test keeps it true. Renaming a role is a breaking change.

### Hosting your own fonts

Load the families and weights listed in `fonts` with whatever your site uses (Google Fonts, Fontsource, self-hosted files). If your font is published under a different family name, for example `Cormorant Garamond Variable`, override the role on the root element:

```css
:root {
  --san-font-family-display: "Cormorant Garamond Variable", "Cormorant Garamond", Georgia, serif;
}
```

Override on `:root` (or `html`), not on a descendant. The type roles (`--san-type-*`) are declared on `:root` and resolve the family there, so an override on a nested element changes `font-family` declarations that read the role directly, but not the type roles.
